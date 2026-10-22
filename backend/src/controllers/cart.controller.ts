// controllers/cart.controller.ts
import type { Request, Response } from "express";
import { optionalUser } from "../middlewares/auth";
import * as service from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

/** Identidad de la cesta: usuario con sesión o invitado con X-Cart-Token. */
async function identityOf(req: Request): Promise<service.CartIdentity> {
  const user = await optionalUser(req);
  const guestToken = req.header("x-cart-token")?.trim();
  return {
    ...(user ? { userId: user.id } : {}),
    ...(guestToken ? { guestToken } : {}),
  };
}

/** GET /api/cart */
export async function getCart(req: Request, res: Response): Promise<void> {
  respond(res, await service.getCart(await identityOf(req)));
}

/** POST /api/cart/items */
export async function addLine(req: Request, res: Response): Promise<void> {
  const { productId, size, color, quantity } = req.body as Partial<service.CartLineInput>;

  if (typeof productId !== "string" || typeof size !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir productId y size");
  }

  const cart = await service.addLine(await identityOf(req), {
    productId,
    size,
    color: typeof color === "string" ? color : "",
    quantity: typeof quantity === "number" ? quantity : 1,
  });

  respond(res, cart, 201);
}

/** PATCH /api/cart/items/:productId */
export async function updateLine(req: Request, res: Response): Promise<void> {
  const { size, color, quantity } = req.body as Partial<{
    size: string;
    color: string;
    quantity: number;
  }>;

  if (typeof size !== "string" || typeof color !== "string" || typeof quantity !== "number") {
    throw ApiError.badRequest("El cuerpo debe incluir size, color y quantity");
  }

  respond(
    res,
    await service.updateLine(await identityOf(req), req.params.productId, {
      size,
      color,
      quantity,
    }),
  );
}

/** DELETE /api/cart/items/:productId?size=..&color=.. */
export async function removeLine(req: Request, res: Response): Promise<void> {
  const size = typeof req.query.size === "string" ? req.query.size : undefined;
  const color = typeof req.query.color === "string" ? req.query.color : undefined;

  respond(
    res,
    await service.removeLine(await identityOf(req), req.params.productId, {
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
    }),
  );
}

/** DELETE /api/cart */
export async function clear(req: Request, res: Response): Promise<void> {
  respond(res, await service.clearCart(await identityOf(req)));
}
