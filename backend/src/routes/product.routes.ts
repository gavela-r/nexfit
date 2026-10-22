// routes/product.routes.ts
import { Router } from "express";
import { categories, getOne, list } from "../controllers/product.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const productRouter = Router();

/** GET /api/products?category=&search=&sort=rating|price-asc|price-desc */
productRouter.get("/products", asyncHandler(list));

/** GET /api/products/:id */
productRouter.get("/products/:id", asyncHandler(getOne));

/** GET /api/categories */
productRouter.get("/categories", asyncHandler(categories));
