// controllers/order.controller.ts
import type { Request, Response } from "express";
import { env } from "../config/env";
import { requireUser } from "../middlewares/auth";
import * as service from "../services/order.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

/**
 * Dirección de la tienda a la que Stripe devuelve al cliente: APP_URL si está
 * definida; si no, el Origin de la petición siempre que sea de confianza.
 */
function storeUrl(req: Request): string {
  if (env.stripe.appUrl) return env.stripe.appUrl;

  const self = `${req.protocol}://${req.get("host")}`;
  const origin = req.header("origin");
  if (origin && (env.corsOrigins.includes(origin) || origin === self)) return origin;
  return self;
}

/** POST /api/checkout/session  { couponCode? } → { url, orderNumber } */
export async function createSession(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const { couponCode } = (req.body ?? {}) as { couponCode?: unknown };
  const code = typeof couponCode === "string" && couponCode.trim() ? couponCode : undefined;
  respond(res, await service.createCheckout(user, storeUrl(req), code), 201);
}

/** POST /api/checkout/confirm  { sessionId } */
export async function confirm(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const { sessionId } = req.body as { sessionId?: unknown };

  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    throw ApiError.badRequest("Falta un sessionId de Stripe válido");
  }

  respond(res, await service.confirmCheckout(user.id, sessionId));
}

/** POST /api/checkout/webhook (cuerpo sin parsear, firmado por Stripe) */
export async function webhook(req: Request, res: Response): Promise<void> {
  await service.handleWebhook(req.body as Buffer, req.header("stripe-signature"));
  respond(res, { received: true });
}

/** GET /api/orders */
export async function list(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await service.listOrders(user.id));
}
