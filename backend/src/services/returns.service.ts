// services/returns.service.ts
// Devoluciones y cambios de talla (tablas returns y return_items).
//   · Solo pedidos 'entregado' y dentro de los 30 días de garantía.
//   · De cada prenda se puede devolver lo comprado menos lo ya solicitado
//     (las solicitudes rechazadas no cuentan).
//   · Devolución: se reembolsa el precio pagado (con el descuento del pedido
//     repartido). Cambio: se elige la talla nueva y no hay reembolso.
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { inTransaction, rows } from "../db/pool";
import { ApiError } from "../utils/ApiError";

const RETURN_WINDOW_DAYS = 30;
const TYPES = ["devolucion", "cambio"] as const;
const REASONS = ["talla", "defecto", "no_esperado", "otro"] as const;

type ReturnType = (typeof TYPES)[number];
type ReturnReason = (typeof REASONS)[number];

export interface ReturnableItem {
  orderItemId: number;
  productId: string | null;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  purchased: number;
  /** Unidades que aún se pueden devolver o cambiar. */
  returnable: number;
  /** Tallas del producto (para elegir la nueva en un cambio). */
  sizes: string[];
}

export interface EligibleOrder {
  orderNumber: string;
  createdAt: string;
  /** Último día para solicitar la devolución. */
  deadline: string;
  items: ReturnableItem[];
}

export interface ReturnView {
  returnNumber: string;
  orderNumber: string;
  type: ReturnType;
  status: string;
  reason: ReturnReason;
  comments: string | null;
  refundAmount: number;
  createdAt: string;
  items: {
    productName: string;
    size: string;
    color: string;
    quantity: number;
    newSize: string | null;
  }[];
}

export interface CreateReturnInput {
  orderNumber: string;
  type: string;
  reason: string;
  comments?: string;
  items: { orderItemId: number; quantity: number; newSize?: string }[];
}

interface EligibleRow extends RowDataPacket {
  order_id: number;
  order_number: string;
  created_at: Date;
  subtotal: number;
  discount: number;
  order_item_id: number;
  product_id: string | null;
  product_name: string;
  size: string;
  color_hex: string;
  unit_price: number;
  quantity: number;
  requested: number;
  sizes: string | null;
}

/** Pedidos entregados dentro de plazo, con lo que queda por devolver de cada línea. */
async function readEligible(userId: string, orderNumber?: string): Promise<EligibleRow[]> {
  return rows<EligibleRow>(
    `SELECT o.id AS order_id, o.order_number, o.created_at, o.subtotal, o.discount,
            oi.id AS order_item_id, oi.product_id, oi.product_name, oi.size, oi.color_hex,
            oi.unit_price, oi.quantity,
            COALESCE((SELECT SUM(ri.quantity)
                        FROM return_items ri
                        JOIN returns r ON r.id = ri.return_id
                       WHERE ri.order_item_id = oi.id AND r.status <> 'rechazada'), 0) AS requested,
            (SELECT GROUP_CONCAT(ps.size ORDER BY ps.sort_order, ps.size SEPARATOR ',')
               FROM product_sizes ps WHERE ps.product_id = oi.product_id) AS sizes
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ?
        AND o.status = 'entregado'
        AND o.created_at >= NOW() - INTERVAL ${RETURN_WINDOW_DAYS} DAY
        ${orderNumber ? "AND o.order_number = ?" : ""}
      ORDER BY o.created_at DESC, oi.id`,
    orderNumber ? [userId, orderNumber] : [userId],
  );
}

function toEligibleOrders(lines: EligibleRow[]): EligibleOrder[] {
  const byOrder = new Map<string, EligibleOrder>();
  for (const line of lines) {
    let order = byOrder.get(line.order_number);
    if (!order) {
      const created = new Date(line.created_at);
      order = {
        orderNumber: line.order_number,
        createdAt: created.toISOString(),
        deadline: new Date(created.getTime() + RETURN_WINDOW_DAYS * 86_400_000).toISOString(),
        items: [],
      };
      byOrder.set(line.order_number, order);
    }
    order.items.push({
      orderItemId: Number(line.order_item_id),
      productId: line.product_id,
      productName: line.product_name,
      size: line.size,
      color: line.color_hex,
      unitPrice: Number(line.unit_price),
      purchased: Number(line.quantity),
      returnable: Math.max(0, Number(line.quantity) - Number(line.requested)),
      sizes: line.sizes ? line.sizes.split(",") : [],
    });
  }
  // Solo los pedidos en los que aún queda algo por devolver.
  return [...byOrder.values()].filter((order) => order.items.some((item) => item.returnable > 0));
}

interface ReturnRow extends RowDataPacket {
  id: number;
  return_number: string;
  order_number: string;
  type: ReturnType;
  status: string;
  reason: ReturnReason;
  comments: string | null;
  refund_amount: number;
  created_at: Date;
}

interface ReturnItemRow extends RowDataPacket {
  return_id: number;
  product_name: string;
  size: string;
  color_hex: string;
  quantity: number;
  new_size: string | null;
}

/** Solicitudes del usuario (más recientes primero) y pedidos que aún admiten devolución. */
export async function listReturns(
  userId: string,
): Promise<{ returns: ReturnView[]; eligibleOrders: EligibleOrder[] }> {
  const requests = await rows<ReturnRow>(
    `SELECT r.id, r.return_number, o.order_number, r.type, r.status, r.reason, r.comments,
            r.refund_amount, r.created_at
       FROM returns r
       JOIN orders o ON o.id = r.order_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC, r.id DESC`,
    [userId],
  );

  const items =
    requests.length > 0
      ? await rows<ReturnItemRow>(
          `SELECT ri.return_id, oi.product_name, oi.size, oi.color_hex, ri.quantity, ri.new_size
             FROM return_items ri
             JOIN order_items oi ON oi.id = ri.order_item_id
            WHERE ri.return_id IN (?)
            ORDER BY ri.id`,
          [requests.map((request) => request.id)],
        )
      : [];

  return {
    returns: requests.map((request) => ({
      returnNumber: request.return_number,
      orderNumber: request.order_number,
      type: request.type,
      status: request.status,
      reason: request.reason,
      comments: request.comments,
      refundAmount: Number(request.refund_amount),
      createdAt: new Date(request.created_at).toISOString(),
      items: items
        .filter((item) => item.return_id === request.id)
        .map((item) => ({
          productName: item.product_name,
          size: item.size,
          color: item.color_hex,
          quantity: Number(item.quantity),
          newSize: item.new_size,
        })),
    })),
    eligibleOrders: toEligibleOrders(await readEligible(userId)),
  };
}

/** Crea una solicitud de devolución o cambio y la devuelve. */
export async function createReturn(userId: string, input: CreateReturnInput): Promise<ReturnView> {
  if (!TYPES.includes(input.type as ReturnType)) {
    throw ApiError.badRequest("Elige si quieres una devolución o un cambio de talla");
  }
  if (!REASONS.includes(input.reason as ReturnReason)) {
    throw ApiError.badRequest("Indica el motivo de la solicitud");
  }
  const type = input.type as ReturnType;
  const comments = input.comments?.trim().slice(0, 500) || null;

  const requested = input.items.filter((item) => item.quantity > 0);
  if (requested.length === 0) {
    throw ApiError.badRequest("Selecciona al menos una prenda");
  }

  const lines = await readEligible(userId, input.orderNumber);
  if (lines.length === 0) {
    throw ApiError.badRequest(
      `El pedido ${input.orderNumber} no admite devoluciones (debe estar entregado y dentro de los ${RETURN_WINDOW_DAYS} días)`,
    );
  }

  const problems: string[] = [];
  let refundBase = 0;
  for (const item of requested) {
    const line = lines.find((candidate) => Number(candidate.order_item_id) === item.orderItemId);
    if (!line) {
      problems.push("Una de las prendas no pertenece a este pedido");
      continue;
    }
    const left = Number(line.quantity) - Number(line.requested);
    if (!Number.isInteger(item.quantity) || item.quantity > left) {
      problems.push(`${line.product_name}: solo puedes solicitar ${left} ud.`);
    }
    if (type === "cambio") {
      const sizes = line.sizes ? line.sizes.split(",") : [];
      if (!item.newSize || !sizes.includes(item.newSize)) {
        problems.push(`${line.product_name}: elige la talla nueva`);
      } else if (item.newSize === line.size) {
        problems.push(`${line.product_name}: la talla nueva debe ser distinta de la actual`);
      }
    }
    refundBase += Number(line.unit_price) * item.quantity;
  }
  if (problems.length > 0) throw ApiError.badRequest("Revisa la solicitud", problems);

  // El descuento del pedido se reparte en proporción entre sus prendas.
  const { order_id: orderId, subtotal, discount } = lines[0];
  const discountShare = Number(subtotal) > 0 ? Number(discount) / Number(subtotal) : 0;
  const refundAmount =
    type === "devolucion" ? Math.round(refundBase * (1 - discountShare) * 100) / 100 : 0;

  const returnNumber = await inTransaction(async (conn) => {
    const placeholder = `TMP-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const [inserted] = await conn.query<ResultSetHeader>(
      `INSERT INTO returns (return_number, order_id, user_id, type, reason, comments, refund_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [placeholder.slice(0, 16), orderId, userId, type, input.reason, comments, refundAmount],
    );
    const id = Number(inserted.insertId);
    const number = `DEV-${String(id).padStart(6, "0")}`;
    await conn.query("UPDATE returns SET return_number = ? WHERE id = ?", [number, id]);

    for (const item of requested) {
      await conn.query(
        "INSERT INTO return_items (return_id, order_item_id, quantity, new_size) VALUES (?, ?, ?, ?)",
        [id, item.orderItemId, item.quantity, type === "cambio" ? item.newSize : null],
      );
    }
    return number;
  });

  const { returns } = await listReturns(userId);
  const created = returns.find((request) => request.returnNumber === returnNumber);
  if (!created) throw new Error("No se encontró la solicitud recién creada");
  return created;
}
