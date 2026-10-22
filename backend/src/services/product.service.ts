// services/product.service.ts
// Lógica de consulta del catálogo (filtro, búsqueda y ordenación).
import { categories } from "../data/categories";
import { findProductById, products } from "../data/products";
import type { Category, Product } from "../types/product";
import { ApiError } from "../utils/ApiError";
import { matchesQuery } from "../utils/normalize";

export type ProductSort = "rating" | "price-asc" | "price-desc";

export interface ProductFilters {
  /** Slug de categoría (fitness, running…) o texto libre del campo category. */
  category?: string;
  /** Búsqueda por nombre o categoría. */
  search?: string;
  sort?: ProductSort;
}

export function listProducts(filters: ProductFilters = {}): Product[] {
  const { category, search, sort = "rating" } = filters;

  let result = products.filter((product) => {
    // "Entrenamiento" también debe encontrar "Training", y "pantalon" "Pantalón".
    const matchesCategory = category
      ? matchesQuery(product.category, category) ||
        matchesQuery(product.category.split("/")[0] ?? "", category)
      : true;

    const matchesSearch = search
      ? matchesQuery(product.name, search) || matchesQuery(product.category, search)
      : true;

    return matchesCategory && matchesSearch;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "rating":
      default:
        return b.rating - a.rating;
    }
  });

  return result;
}

export function getProduct(id: string): Product {
  const product = findProductById(id);
  if (!product) {
    throw ApiError.notFound(`No existe el producto "${id}"`);
  }
  return product;
}

export function listCategories(): Category[] {
  return categories;
}
