// controllers/account.controller.ts
// Área de cliente: direcciones, devoluciones/cambios, reseñas y cupones. Todo requiere sesión.
import type { Request, Response } from "express";
import { requireUser } from "../middlewares/auth";
import * as addresses from "../services/addresses.service";
import * as coupons from "../services/coupons.service";
import * as returns from "../services/returns.service";
import * as reviews from "../services/reviews.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

/** GET /api/returns → { returns, eligibleOrders } */
export async function listReturns(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await returns.listReturns(user.id));
}

/** POST /api/returns  { orderNumber, type, reason, comments?, items: [{ orderItemId, quantity, newSize? }] } */
export async function createReturn(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const body = req.body as Partial<returns.CreateReturnInput>;

  if (typeof body.orderNumber !== "string" || !Array.isArray(body.items)) {
    throw ApiError.badRequest("El cuerpo debe incluir orderNumber e items");
  }

  const items = body.items.map((item) => ({
    orderItemId: Number(item?.orderItemId),
    quantity: Number(item?.quantity),
    ...(typeof item?.newSize === "string" ? { newSize: item.newSize } : {}),
  }));

  respond(
    res,
    await returns.createReturn(user.id, {
      orderNumber: body.orderNumber,
      type: String(body.type ?? ""),
      reason: String(body.reason ?? ""),
      ...(typeof body.comments === "string" ? { comments: body.comments } : {}),
      items,
    }),
    201,
  );
}

/** GET /api/reviews/mine → { reviews, pending } */
export async function myReviews(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await reviews.getMyReviews(user.id));
}

/** POST /api/reviews  { productId, rating, title?, comment? } (crea o actualiza) */
export async function saveReview(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const { productId, rating, title, comment } = req.body as Record<string, unknown>;

  if (typeof productId !== "string" || typeof rating !== "number") {
    throw ApiError.badRequest("El cuerpo debe incluir productId y rating");
  }

  respond(
    res,
    await reviews.saveReview(user.id, {
      productId,
      rating,
      ...(typeof title === "string" ? { title } : {}),
      ...(typeof comment === "string" ? { comment } : {}),
    }),
  );
}

/** DELETE /api/reviews/:productId */
export async function deleteReview(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await reviews.deleteReview(user.id, req.params.productId));
}

/** GET /api/coupons → cupones con su estado para el usuario */
export async function listCoupons(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await coupons.listCoupons(user.id));
}

/** POST /api/coupons/validate  { code } → cupón (400 si no es válido para este usuario) */
export async function validateCoupon(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const { code } = req.body as { code?: unknown };
  if (typeof code !== "string") throw ApiError.badRequest("Falta el código");
  respond(res, await coupons.validateCoupon(user.id, code));
}

/** Datos de una dirección del cuerpo de la petición (400 si faltan campos). */
function addressInput(body: unknown): addresses.AddressInput {
  const value = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof value[key] === "string" ? (value[key] as string) : "");
  if (!text("fullName") || !text("addressLine") || !text("city") || !text("postalCode")) {
    throw ApiError.badRequest("Revisa la dirección", [
      "Completa nombre, dirección, ciudad y código postal",
    ]);
  }
  return {
    label: text("label") || null,
    fullName: text("fullName"),
    phone: text("phone") || null,
    addressLine: text("addressLine"),
    city: text("city"),
    postalCode: text("postalCode"),
    country: text("country") || "ES",
    isDefault: value.isDefault === true,
  };
}

function addressId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw ApiError.badRequest("Dirección no válida");
  return id;
}

/** GET /api/addresses */
export async function listAddresses(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await addresses.listAddresses(user.id));
}

/** POST /api/addresses → lista actualizada */
export async function createAddress(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await addresses.createAddress(user.id, addressInput(req.body)), 201);
}

/** PATCH /api/addresses/:id → lista actualizada */
export async function updateAddress(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await addresses.updateAddress(user.id, addressId(req), addressInput(req.body)));
}

/** DELETE /api/addresses/:id → lista actualizada */
export async function deleteAddress(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await addresses.deleteAddress(user.id, addressId(req)));
}

/** POST /api/addresses/:id/default → lista actualizada */
export async function setDefaultAddress(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await addresses.setDefaultAddress(user.id, addressId(req)));
}
