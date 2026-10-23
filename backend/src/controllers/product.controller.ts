// controllers/product.controller.ts
import type { Request, Response } from "express";
import { optionalUser } from "../middlewares/auth";
import * as service from "../services/product.service";
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

/** GET /api/categories */
export async function categories(_req: Request, res: Response): Promise<void> {
  respond(res, await service.listCategories());
}
