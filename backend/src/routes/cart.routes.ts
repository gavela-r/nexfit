// routes/cart.routes.ts
import { Router } from "express";
import { addLine, clear, getCart, removeLine } from "../controllers/cart.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const cartRouter = Router();

/** GET /api/cart */
cartRouter.get("/cart", asyncHandler(getCart));

/** POST /api/cart/items */
cartRouter.post("/cart/items", asyncHandler(addLine));

/** DELETE /api/cart/items/:productId */
cartRouter.delete("/cart/items/:productId", asyncHandler(removeLine));

/** DELETE /api/cart */
cartRouter.delete("/cart", asyncHandler(clear));
