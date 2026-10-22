// routes/favorites.routes.ts
import { Router } from "express";
import { add, list, remove } from "../controllers/favorites.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const favoritesRouter = Router();

/** GET /api/favorites */
favoritesRouter.get("/favorites", asyncHandler(list));

/** POST /api/favorites  { productId } */
favoritesRouter.post("/favorites", asyncHandler(add));

/** DELETE /api/favorites/:productId */
favoritesRouter.delete("/favorites/:productId", asyncHandler(remove));
