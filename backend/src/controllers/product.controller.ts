// controllers/product.controller.ts
import type { Request, Response } from "express";
import { optionalUser } from "../middlewares/auth";
import * as service from "../services/product.service";
import { listProductReviews, type ReviewSort } from "../services/reviews.service";
import type { ProductSort } from "../services/product.service";
import type { Audience } from "../types/product";
import { respond } from "../utils/respond";

const SORTS: ProductSort[] = ["rating", "price-asc", "price-desc"];

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function asSort(value: unknown): ProductSort | undefined {
  const text = asText(value);
  return SORTS.includes(text as ProductSort) ? (text as ProductSort) : undefined;
}

const AUDIENCES: Audience[] = ["hombre", "mujer", "unisex"];

function asAudience(value: unknown): Audience | undefined {
  const text = asText(value);
  return AUDIENCES.includes(text as Audience) ? (text as Audience) : undefined;
}

/** GET /api/products */
export async function list(req: Request, res: Response): Promise<void> {
  const user = await optionalUser(req);
  const filters: service.ProductFilters = {
    category: asText(req.query.category),
    search: asText(req.query.search),
    audience: asAudience(req.query.audience),
    sort: asSort(req.query.sort) ?? "rating",
  };

  respond(res, await service.listProducts(filters, user?.id));
}

/** GET /api/products/:id */
export async function getOne(req: Request, res: Response): Promise<void> {
  const user = await optionalUser(req);
  respond(res, await service.getProduct(req.params.id, user?.id));
}

/** GET /api/products/:id/page → ficha: producto, colores con nombre, stock por talla y relacionados */
export async function page(req: Request, res: Response): Promise<void> {
  const user = await optionalUser(req);
  respond(res, await service.getProductPage(req.params.id, user?.id));
}

const REVIEW_SORTS: ReviewSort[] = ["recientes", "mejores", "peores"];

/** GET /api/products/:id/reviews?sort=recientes|mejores|peores&page=1 */
export async function reviews(req: Request, res: Response): Promise<void> {
  const user = await optionalUser(req);
  const sort = asText(req.query.sort);
  respond(
    res,
    await listProductReviews(req.params.id, {
      sort: REVIEW_SORTS.includes(sort as ReviewSort) ? (sort as ReviewSort) : "recientes",
      page: Number(req.query.page) || 1,
      ...(user ? { userId: user.id } : {}),
    }),
  );
}

/** GET /api/categories */
export async function categories(_req: Request, res: Response): Promise<void> {
  respond(res, await service.listCategories());
}
