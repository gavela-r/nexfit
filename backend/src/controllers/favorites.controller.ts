// controllers/favorites.controller.ts
import type { Request, Response } from "express";
import { requireUser } from "../middlewares/auth";
import * as service from "../services/favorites.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

/** GET /api/favorites */
export async function list(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await service.listFavorites(user.id));
}

/** POST /api/favorites  { productId } */
export async function add(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  const { productId } = req.body as { productId?: unknown };

  if (typeof productId !== "string" || productId.trim().length === 0) {
    throw ApiError.badRequest("Falta el campo productId");
  }

  respond(res, await service.addFavorite(user.id, productId.trim()), 201);
}

/** DELETE /api/favorites/:productId */
export async function remove(req: Request, res: Response): Promise<void> {
  const user = await requireUser(req);
  respond(res, await service.removeFavorite(user.id, req.params.productId));
}
