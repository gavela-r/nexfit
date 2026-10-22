// services/cart.service.ts
// Carrito persistido en MySQL.
//   · carts      → una cesta abierta por usuario, o por invitado (guest_token)
//   · cart_items → líneas con talla, color, cantidad y precio congelado
// El cliente guarda el `cartToken` del invitado y lo envía en X-Cart-Token.
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { run, rows } from "../db/pool";
import type { CartItem } from "../types/product";
import { ApiError } from "../utils/ApiError";

export interface CartIdentity {
  /** Usuario con sesión iniciada (cesta propia). */
  userId?: string;
  /** Invitado: token guardado en el navegador. */
  guestToken?: string;
}

export interface CartLineInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface CartView {
  items: CartItem[];
  count: number;
  total: number;
  /** Token de la cesta de invitado (null si es de un usuario). */
  cartToken: string | null;
}

interface CartRef {
  id: number;
  token: string | null;
}

interface CartLineRow extends RowDataPacket {
  product_id: string;
  size: string;
  color_hex: string;
  quantity: number;
  unit_price: number;
  product_name: string;
  image_url: string;
}

const EMPTY_CART: CartView = { items: [], count: 0, total: 0, cartToken: null };

/**
 * Busca la cesta abierta del usuario o del invitado.
 * Nota: un usuario puede tener varias filas históricas, pero solo se reutiliza
 * la última con status = 'abierto'.
 */
async function findOpenCart(identity: CartIdentity): Promise<CartRef | null> {
  if (identity.userId) {
    const [cart] = await rows<RowDataPacket & { id: number }>(
      "SELECT id FROM carts WHERE user_id = ? AND status = 'abierto' ORDER BY id DESC LIMIT 1",
      [identity.userId],
    );
    return cart ? { id: cart.id, token: null } : null;
  }

  if (identity.guestToken) {
    const [cart] = await rows<RowDataPacket & { id: number }>(
      `SELECT id FROM carts
        WHERE guest_token = ? AND user_id IS NULL AND status = 'abierto'
        ORDER BY id DESC LIMIT 1`,
      [identity.guestToken],
    );
    return cart ? { id: cart.id, token: identity.guestToken } : null;
  }

  return null;
}

/** Devuelve la cesta abierta, creándola si no existe (y si se pide). */
async function resolveCart(identity: CartIdentity, create = true): Promise<CartRef | null> {
  const existing = await findOpenCart(identity);
  if (existing) return existing;
  if (!create) return null;

  if (identity.userId) {
    const result = await run("INSERT INTO carts (user_id, status) VALUES (?, 'abierto')", [
      identity.userId,
    ]);
    return { id: Number(result.insertId), token: null };
  }

  const token = identity.guestToken ?? randomBytes(32).toString("hex");
  const result = await run("INSERT INTO carts (guest_token, status) VALUES (?, 'abierto')", [
    token,
  ]);
  return { id: Number(result.insertId), token };
}

/** Lee las líneas de la cesta y calcula unidades y total. */
async function readCart(cart: CartRef | null): Promise<CartView> {
  if (!cart) return { ...EMPTY_CART };

  const lines = await rows<CartLineRow>(
    `SELECT ci.product_id, ci.size, ci.color_hex, ci.quantity, ci.unit_price,
            p.name AS product_name, p.image_url
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.added_at, ci.id`,
    [cart.id],
  );

  const items: CartItem[] = lines.map((line) => ({
    productId: line.product_id,
    size: line.size,
    color: line.color_hex,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unit_price),
    name: line.product_name,
    image: line.image_url,
  }));

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return { items, count, total: Number(total.toFixed(2)), cartToken: cart.token };
}

/** Carrito actual (crea la cesta de invitado si es la primera visita). */
export async function getCart(identity: CartIdentity): Promise<CartView> {
  const cart = await resolveCart(identity, true);
  return readCart(cart);
}

/** Añade una línea (o suma cantidad si ya existía la misma talla y color). */
export async function addLine(identity: CartIdentity, input: CartLineInput): Promise<CartView> {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99) {
    throw ApiError.badRequest("La cantidad debe estar entre 1 y 99");
  }

  const [product] = await rows<RowDataPacket & { id: string; name: string; price: number }>(
    "SELECT id, name, price FROM products WHERE id = ? AND is_active = 1 LIMIT 1",
    [input.productId],
  );
  if (!product) {
    throw ApiError.badRequest(`Producto desconocido: ${input.productId}`);
  }

  const sizes = await rows<RowDataPacket & { size: string }>(
    "SELECT size FROM product_sizes WHERE product_id = ? ORDER BY sort_order, size",
    [input.productId],
  );
  if (!sizes.some((row) => row.size === input.size)) {
    throw ApiError.badRequest(
      `La talla "${input.size}" no está disponible para ${product.name}`,
      sizes.map((row) => row.size),
    );
  }

  let color = input.color.trim();
  if (!color) {
    const [firstColor] = await rows<RowDataPacket & { color_hex: string }>(
      "SELECT color_hex FROM product_colors WHERE product_id = ? ORDER BY sort_order, color_hex LIMIT 1",
      [input.productId],
    );
    color = firstColor?.color_hex ?? "";
  }

  if (!color) {
    throw ApiError.badRequest(`No hay colores disponibles para ${product.name}`);
  }

  const [colorExists] = await rows<RowDataPacket & { color_hex: string }>(
    "SELECT color_hex FROM product_colors WHERE product_id = ? AND color_hex = ? LIMIT 1",
    [input.productId, color],
  );
  if (!colorExists) {
    throw ApiError.badRequest(`El color "${color}" no está disponible para ${product.name}`);
  }

  const cart = await resolveCart(identity, true);
  if (!cart) throw ApiError.badRequest("No se pudo crear el carrito");

  await run(
    `INSERT INTO cart_items (cart_id, product_id, size, color_hex, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), 99)`,
    [cart.id, input.productId, input.size, color, input.quantity, product.price],
  );

  return readCart(cart);
}

/** Quita todas las líneas de un producto (la cantidad la decide el cliente). */
export async function removeLine(identity: CartIdentity, productId: string): Promise<CartView> {
  const cart = await resolveCart(identity, false);
  if (!cart) {
    throw ApiError.notFound(`El producto "${productId}" no está en el carrito`);
  }

  const result = await run("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", [
    cart.id,
    productId,
  ]);

  if (result.affectedRows === 0) {
    throw ApiError.notFound(`El producto "${productId}" no está en el carrito`);
  }

  return readCart(cart);
}

/** Vacía la cesta abierta. */
export async function clearCart(identity: CartIdentity): Promise<CartView> {
  const cart = await resolveCart(identity, false);
  if (cart) {
    await run("DELETE FROM cart_items WHERE cart_id = ?", [cart.id]);
  }
  return readCart(cart);
}

/**
 * Al iniciar sesión (o registrarse) las líneas del carrito de invitado pasan
 * al carrito del usuario, sumando cantidades si coincide talla y color.
 */
export async function mergeGuestCart(
  guestToken: string | undefined,
  userId: string,
): Promise<void> {
  if (!guestToken) return;

  const guest = await findOpenCart({ guestToken });
  if (!guest) return;

  const userCart = await resolveCart({ userId }, true);
  if (!userCart) return;

  const guestLines = await rows<
    RowDataPacket & {
      product_id: string;
      size: string;
      color_hex: string;
      quantity: number;
      unit_price: number;
    }
  >(
    `SELECT product_id, size, color_hex, quantity, unit_price
       FROM cart_items
      WHERE cart_id = ?`,
    [guest.id],
  );

  // Una a una: son pocas líneas y así se respeta el UNIQUE de la línea.
  for (const line of guestLines) {
    await run(
      `INSERT INTO cart_items (cart_id, product_id, size, color_hex, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = LEAST(quantity + VALUES(quantity), 99)`,
      [userCart.id, line.product_id, line.size, line.color_hex, line.quantity, line.unit_price],
    );
  }

  // Borra la cesta de invitado (las líneas caen por CASCADE).
  await run("DELETE FROM carts WHERE id = ?", [guest.id]);
}
