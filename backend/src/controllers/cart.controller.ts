// controllers/cart.controller.ts
import type { Request, Response } from "express";
import * as service from "../services/cart.service";
import { respond } from "../utils/respond";
import { ApiError } from "../utils/ApiError";

/** GET /api/cart */
export async function getCart(_req: Request, res: Response): Promise<void> {
  respond(res, service.getCart());
}

/** POST /api/cart/items */
export async function addLine(req: Request, res: Response): Promise<void> {
  const { productId, size, color, quantity } = req.body as Partial<service.CartLineInput>;

  if (typeof productId !== "string" || typeof size !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir productId y size");
  }

  const cart = service.addLine({
    productId,
    size,
    color: typeof color === "string" ? color : "",
    quantity: typeof quantity === "number" ? quantity : 1,
  });

  respond(res, cart, 201);
}

/** DELETE /api/cart/items/:productId */
export async function removeLine(req: Request, res: Response): Promise<void> {
  service.removeLine(req.params.productId);
  respond(res, service.getCart());
}

/** DELETE /api/cart */
export async function clear(_req: Request, res: Response): Promise<void> {
  service.clearCart();
  respond(res, service.getCart());
}
