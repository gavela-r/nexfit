// controllers/product.controller.ts
import type { Request, Response } from "express";
import * as service from "../services/product.service";
import type { ProductSort } from "../services/product.service";
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

/** GET /api/products */
export async function list(req: Request, res: Response): Promise<void> {
  const filters: service.ProductFilters = {
    category: asText(req.query.category),
    search: asText(req.query.search),
    sort: asSort(req.query.sort) ?? "rating",
  };

  respond(res, service.listProducts(filters));
}

/** GET /api/products/:id */
export async function getOne(req: Request, res: Response): Promise<void> {
  const product = service.getProduct(req.params.id);
  respond(res, product);
}

/** GET /api/categories */
export async function categories(_req: Request, res: Response): Promise<void> {
  respond(res, service.listCategories());
}
