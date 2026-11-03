// services/coupons.service.ts
// Cupones de la tienda. No se acumulan: cada pedido lleva uno solo.
//   · CLUB10 → 10% para socios, se aplica solo en cuanto hay sesión.
//   · MOVE15 → 15% de bienvenida, solo en el primer pedido (sustituye a CLUB10).
// «Primer pedido» = el usuario no tiene ningún pedido pagado, enviado o entregado.
import type { RowDataPacket } from "mysql2/promise";
import { rows } from "../db/pool";
import { ApiError } from "../utils/ApiError";

export interface Coupon {
  code: string;
  percent: number;
  title: string;
  description: string;
  /** Se aplica sin escribir el código. */
  automatic: boolean;
}

export type CouponStatus = "activo" | "disponible" | "usado" | "no_disponible";

export const CLUB_COUPON: Coupon = {
  code: "CLUB10",
  percent: 10,
  title: "10% en todos tus pedidos",
  description:
    "Ventaja de socio. Se aplica sola en la cesta y en el pago mientras tengas la sesión iniciada.",
  automatic: true,
};

export const WELCOME_COUPON: Coupon = {
  code: "MOVE15",
  percent: 15,
  title: "15% de bienvenida en tu primer pedido",
  description:
    "Escríbelo en la cesta antes de pagar. Sustituye al 10% del Club en tu primera compra (no se acumulan).",
  automatic: false,
};

/** Pedidos ya cobrados del usuario, y si en alguno usó el cupón de bienvenida. */
async function purchaseHistory(userId: string): Promise<{ paid: number; usedWelcome: boolean }> {
  const [row] = await rows<RowDataPacket & { paid: number; welcome: number }>(
    `SELECT COUNT(*) AS paid, COALESCE(SUM(coupon_code = ?), 0) AS welcome
       FROM orders
      WHERE user_id = ? AND status IN ('pagado', 'enviado', 'entregado')`,
    [WELCOME_COUPON.code, userId],
  );
  return { paid: Number(row?.paid ?? 0), usedWelcome: Number(row?.welcome ?? 0) > 0 };
}

/** Comprueba un código escrito por el usuario y devuelve el cupón (400 si no vale). */
export async function validateCoupon(userId: string, rawCode: string): Promise<Coupon> {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw ApiError.badRequest("Escribe un código de descuento");

  if (code === CLUB_COUPON.code) {
    throw ApiError.badRequest("CLUB10 ya se aplica automáticamente por ser socio");
  }
  if (code !== WELCOME_COUPON.code) {
    throw ApiError.badRequest(`El código ${code} no existe o ha caducado`);
  }

  const history = await purchaseHistory(userId);
  if (history.usedWelcome) {
    throw ApiError.badRequest("Ya usaste MOVE15 en un pedido anterior");
  }
  if (history.paid > 0) {
    throw ApiError.badRequest("MOVE15 solo es válido en tu primer pedido");
  }
  return WELCOME_COUPON;
}

/** Cupones de la página del Club con su estado para este usuario. */
export async function listCoupons(userId: string): Promise<(Coupon & { status: CouponStatus })[]> {
  const history = await purchaseHistory(userId);
  return [
    { ...CLUB_COUPON, status: "activo" },
    {
      ...WELCOME_COUPON,
      status: history.usedWelcome ? "usado" : history.paid > 0 ? "no_disponible" : "disponible",
    },
  ];
}
