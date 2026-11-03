// services/order.service.ts
// Pedidos y pago con Stripe Checkout.
//   1. createCheckout   → copia la cesta en orders/order_items ('pendiente') y
//                         abre una sesión de Stripe Checkout con esas líneas.
//   2. finalizeCheckout → cuando Stripe confirma el cobro (vuelta del cliente o
//                         webhook), el pedido pasa a 'pagado', se guardan los
//                         datos de envío, la cesta queda 'convertido' y baja el stock.
// La finalización es idempotente: da igual cuántas veces llegue la confirmación.
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import Stripe from "stripe";
import { env } from "../config/env";
import { inTransaction, rows, run } from "../db/pool";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { getOpenCartForCheckout } from "./cart.service";
import { getDefaultAddress, saveFromCheckout } from "./addresses.service";
import { CLUB_COUPON, validateCoupon } from "./coupons.service";

/** Mismas reglas que el panel de la cesta (CartDrawer). */
const FREE_SHIPPING_FROM = 50;
const SHIPPING_COST = 4.95;

/** Países a los que se envía (orders.shipping_country). */
const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["ES", "PT"];

export interface OrderLineView {
  /** id de order_items (lo usan las devoluciones). */
  id: number;
  productId: string | null;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderView {
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  /** Cupón del descuento: CLUB10 o MOVE15 (null en pedidos sin descuento). */
  couponCode: string | null;
  total: number;
  currency: string;
  paymentMethod: string | null;
  email: string | null;
  shipping: {
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
  };
  items: OrderLineView[];
  createdAt: string;
}

interface OrderRow extends RowDataPacket {
  id: number;
  order_number: string;
  user_id: string | null;
  status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  currency: string;
  payment_method: string | null;
  shipping_name: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
  id: number;
  product_id: string | null;
  product_name: string;
  size: string;
  color_hex: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

let stripeClient: Stripe | null = null;

/** Cliente de Stripe (503 si no hay STRIPE_SECRET_KEY). */
function stripe(): Stripe {
  if (!env.stripe.secretKey) {
    throw ApiError.unavailable(
      "El pago con tarjeta no está configurado: falta STRIPE_SECRET_KEY en el backend",
    );
  }
  stripeClient ??= new Stripe(env.stripe.secretKey);
  return stripeClient;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
const cents = (value: number) => Math.round(value * 100);

async function readOrder(orderId: number): Promise<OrderView> {
  const [order] = await rows<OrderRow>("SELECT * FROM orders WHERE id = ? LIMIT 1", [orderId]);
  if (!order) throw ApiError.notFound("Pedido no encontrado");

  const items = await rows<OrderItemRow>(
    `SELECT id, product_id, product_name, size, color_hex, quantity, unit_price, line_total
       FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId],
  );

  return {
    orderNumber: order.order_number,
    status: order.status,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    discount: Number(order.discount),
    couponCode: order.coupon_code,
    total: Number(order.total),
    currency: order.currency,
    paymentMethod: order.payment_method,
    email: order.shipping_email,
    shipping: {
      name: order.shipping_name,
      phone: order.shipping_phone,
      address: order.shipping_address,
      city: order.shipping_city,
      postalCode: order.shipping_postal_code,
      country: order.shipping_country,
    },
    items: items.map((item) => ({
      id: Number(item.id),
      productId: item.product_id,
      productName: item.product_name,
      size: item.size,
      color: item.color_hex,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      lineTotal: Number(item.line_total),
    })),
    createdAt: new Date(order.created_at).toISOString(),
  };
}

/**
 * Cliente de Stripe del usuario (se busca por correo para no duplicarlo) con su
 * dirección predeterminada como dirección de envío. null si no tiene ninguna.
 */
async function stripeCustomerWithAddress(
  client: Stripe,
  user: { id: string; name: string; email: string },
): Promise<Stripe.Customer | null> {
  const address = await getDefaultAddress(user.id);
  if (!address) return null;

  const shipping: Stripe.CustomerUpdateParams.Shipping = {
    name: address.fullName,
    ...(address.phone ? { phone: address.phone } : {}),
    address: {
      line1: address.addressLine,
      city: address.city,
      postal_code: address.postalCode,
      country: address.country,
    },
  };

  const [existing] = (await client.customers.list({ email: user.email, limit: 1 })).data;
  if (existing) {
    return client.customers.update(existing.id, { name: user.name, shipping });
  }
  return client.customers.create({
    email: user.email,
    name: user.name,
    shipping,
    metadata: { userId: user.id },
  });
}

/**
 * Convierte la cesta del usuario en un pedido pendiente y abre Stripe Checkout.
 * Devuelve la URL de la página de pago alojada por Stripe.
 */
export async function createCheckout(
  user: { id: string; name: string; email: string },
  storeUrl: string,
  couponCode?: string,
): Promise<{ url: string; orderNumber: string }> {
  const client = stripe();

  const open = await getOpenCartForCheckout(user.id);
  if (!open || open.cart.items.length === 0) {
    throw ApiError.badRequest("La cesta está vacía");
  }
  const { cartId, cart } = open;

  // El importe se calcula siempre en el servidor (el cliente solo lo muestra).
  // Para tramitar hace falta sesión, así que siempre hay un cupón: CLUB10 por
  // defecto, o MOVE15 si el usuario lo ha escrito y es su primer pedido.
  const coupon = couponCode ? await validateCoupon(user.id, couponCode) : CLUB_COUPON;
  const subtotal = round2(cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0));
  // En céntimos enteros, con la misma fórmula que la cesta (CartDrawer).
  const discount = Math.round((cents(subtotal) * coupon.percent) / 100) / 100;
  const shippingCost = subtotal < FREE_SHIPPING_FROM ? SHIPPING_COST : 0;
  const total = round2(subtotal - discount + shippingCost);

  const { orderId, orderNumber } = await inTransaction(async (conn) => {
    // Los intentos anteriores que nunca se pagaron dejan de estar vigentes.
    await conn.query(
      "UPDATE orders SET status = 'cancelado' WHERE user_id = ? AND status = 'pendiente'",
      [user.id],
    );

    const placeholder = `TMP-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const [inserted] = await conn.query<ResultSetHeader>(
      `INSERT INTO orders
         (order_number, user_id, status, subtotal, shipping_cost, discount, coupon_code, total,
          currency, payment_method, shipping_name, shipping_email)
       VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, 'EUR', 'tarjeta', ?, ?)`,
      [
        placeholder.slice(0, 16),
        user.id,
        subtotal,
        shippingCost,
        discount,
        coupon.code,
        total,
        user.name,
        user.email,
      ],
    );
    const id = Number(inserted.insertId);
    const number = `NXF-${String(id).padStart(6, "0")}`;
    await conn.query("UPDATE orders SET order_number = ? WHERE id = ?", [number, id]);

    for (const item of cart.items) {
      await conn.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, size, color_hex, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.productId,
          item.name ?? item.productId,
          item.size,
          item.color,
          item.quantity,
          item.unitPrice,
        ],
      );
    }

    return { orderId: id, orderNumber: number };
  });

  const metadata = { orderId: String(orderId), userId: user.id, cartId: String(cartId) };

  try {
    // El descuento se aplica como cupón de Stripe de un solo uso por el importe exacto,
    // para que el total de Stripe coincida al céntimo con el del pedido.
    const stripeCoupon =
      discount > 0
        ? await client.coupons.create({
            amount_off: cents(discount),
            currency: "eur",
            duration: "once",
            max_redemptions: 1,
            name: `Descuento ${coupon.percent}% (${coupon.code})`,
          })
        : null;

    // Con una dirección predeterminada, Stripe recibe un cliente con esa
    // dirección y el formulario de pago sale relleno (se puede cambiar).
    const customer = await stripeCustomerWithAddress(client, user);

    const session = await client.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      ...(customer
        ? { customer: customer.id, customer_update: { shipping: "auto", name: "auto" } }
        : { customer_email: user.email }),
      client_reference_id: String(orderId),
      metadata,
      payment_intent_data: { metadata, description: `Pedido ${orderNumber}` },
      line_items: cart.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: cents(item.unitPrice),
          product_data: {
            name: item.name ?? item.productId,
            description: `Talla ${item.size} · ${item.colorName ?? item.color}`,
          },
        },
      })),
      ...(stripeCoupon ? { discounts: [{ coupon: stripeCoupon.id }] } : {}),
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: shippingCost > 0 ? "Envío estándar (24-48h)" : "Envío gratis (24-48h)",
            fixed_amount: { amount: cents(shippingCost), currency: "eur" },
          },
        },
      ],
      // La consulta va antes del hash: el enrutado de la SPA usa «#/...».
      success_url: `${storeUrl}/?session_id={CHECKOUT_SESSION_ID}#/pedido/confirmado`,
      cancel_url: `${storeUrl}/#/pedido/cancelado`,
    });

    if (!session.url) throw new Error("Stripe no devolvió la URL de pago");
    return { url: session.url, orderNumber };
  } catch (error) {
    // Sin sesión de pago el pedido no sirve para nada.
    await run("UPDATE orders SET status = 'cancelado' WHERE id = ? AND status = 'pendiente'", [
      orderId,
    ]);
    if (error instanceof Stripe.errors.StripeError) {
      logger.error(`Stripe rechazó la sesión de pago: ${error.message}`);
      throw new ApiError(502, `No se pudo iniciar el pago: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Marca el pedido como pagado a partir de una sesión de Checkout completada.
 * Si la sesión no está pagada todavía, deja el pedido como está.
 */
async function finalizeSession(session: Stripe.Checkout.Session): Promise<number> {
  const orderId = Number(session.metadata?.orderId ?? session.client_reference_id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw ApiError.badRequest("La sesión de pago no corresponde a ningún pedido");
  }
  if (session.payment_status !== "paid") return orderId;

  const cartId = Number(session.metadata?.cartId);
  const shipping = session.collected_information?.shipping_details ?? null;
  const customer = session.customer_details;
  const address = shipping?.address ?? customer?.address ?? null;
  const street = [address?.line1, address?.line2].filter(Boolean).join(", ");

  await inTransaction(async (conn) => {
    const [found] = await conn.query<OrderRow[]>(
      "SELECT id, user_id, status, total FROM orders WHERE id = ? FOR UPDATE",
      [orderId],
    );
    const order = found[0];
    if (!order) throw ApiError.notFound("Pedido no encontrado");

    // Ya procesado (vuelta del cliente y webhook pueden llegar a la vez).
    // 'cancelado' sí se acepta: un intento antiguo que al final se pagó.
    if (order.status !== "pendiente" && order.status !== "cancelado") return;

    if (session.amount_total !== null && session.amount_total !== cents(Number(order.total))) {
      logger.warn(
        `Pedido ${orderId}: Stripe cobró ${session.amount_total} céntimos y el pedido marca ${order.total} €`,
      );
    }

    await conn.query(
      `UPDATE orders
          SET status = 'pagado',
              shipping_name = COALESCE(?, shipping_name),
              shipping_email = COALESCE(?, shipping_email),
              shipping_phone = ?,
              shipping_address = ?,
              shipping_city = ?,
              shipping_postal_code = ?,
              shipping_country = COALESCE(?, shipping_country)
        WHERE id = ?`,
      [
        shipping?.name ?? customer?.name ?? null,
        customer?.email ?? null,
        customer?.phone ?? null,
        street ? street.slice(0, 160) : null,
        address?.city ?? null,
        address?.postal_code ?? null,
        address?.country ?? null,
        orderId,
      ],
    );

    // Primer pedido sin direcciones guardadas: la usada pasa a ser la predeterminada.
    if (order.user_id) {
      try {
        await saveFromCheckout(conn, order.user_id, {
          fullName: shipping?.name ?? customer?.name ?? null,
          phone: customer?.phone ?? null,
          addressLine: street || null,
          city: address?.city ?? null,
          postalCode: address?.postal_code ?? null,
          country: address?.country ?? null,
        });
      } catch (error) {
        logger.warn(`No se pudo guardar la dirección del pedido ${orderId}`, error);
      }
    }

    // La cesta ya es un pedido: la próxima compra empieza con una nueva.
    if (Number.isInteger(cartId) && cartId > 0) {
      await conn.query(
        "UPDATE carts SET status = 'convertido' WHERE id = ? AND status = 'abierto'",
        [cartId],
      );
    }

    // Descuenta el stock de cada talla (sin bajar de 0; la columna es UNSIGNED).
    await conn.query(
      `UPDATE product_sizes ps
         JOIN order_items oi ON oi.product_id = ps.product_id AND oi.size = ps.size
          SET ps.stock = IF(ps.stock > oi.quantity, ps.stock - oi.quantity, 0)
        WHERE oi.order_id = ?`,
      [orderId],
    );
  });

  logger.info(`Pedido ${orderId} pagado (sesión ${session.id})`);
  return orderId;
}

/** Vuelta desde Stripe: comprueba la sesión y devuelve el pedido. */
export async function confirmCheckout(userId: string, sessionId: string): Promise<OrderView> {
  const client = stripe();

  let session: Stripe.Checkout.Session;
  try {
    session = await client.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      throw ApiError.notFound("Sesión de pago no encontrada");
    }
    if (error instanceof Stripe.errors.StripeError) {
      logger.error(`Stripe no respondió al confirmar el pago: ${error.message}`);
      throw new ApiError(502, "No se pudo comprobar el pago con Stripe");
    }
    throw error;
  }

  if (session.metadata?.userId !== userId) {
    throw ApiError.forbidden("Este pago pertenece a otra cuenta");
  }

  return readOrder(await finalizeSession(session));
}

/** Webhook de Stripe: verifica la firma y procesa los pagos completados. */
export async function handleWebhook(payload: Buffer, signature: string | undefined): Promise<void> {
  const client = stripe();
  if (!env.stripe.webhookSecret) {
    throw ApiError.unavailable("Webhook de Stripe sin configurar (STRIPE_WEBHOOK_SECRET)");
  }
  if (!signature) throw ApiError.badRequest("Falta la cabecera Stripe-Signature");

  let event: Stripe.Event;
  try {
    event = client.webhooks.constructEvent(payload, signature, env.stripe.webhookSecret);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw ApiError.badRequest(`Firma del webhook no válida: ${reason}`);
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await finalizeSession(event.data.object);
  }
}

/** Pedidos del usuario, del más reciente al más antiguo. */
export async function listOrders(userId: string): Promise<OrderView[]> {
  const ids = await rows<RowDataPacket & { id: number }>(
    "SELECT id FROM orders WHERE user_id = ? AND status <> 'cancelado' ORDER BY created_at DESC, id DESC",
    [userId],
  );
  return Promise.all(ids.map((row) => readOrder(row.id)));
}
