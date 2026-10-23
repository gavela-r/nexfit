// services/product.service.ts
// Catálogo leído de MySQL (products, product_sizes, product_colors, categories)
// con filtro por categoría, búsqueda y ordenación.
import type { RowDataPacket } from "mysql2";
import { rows } from "../db/pool";
import type { Audience, Category, Product, ProductColor } from "../types/product";
import { ApiError } from "../utils/ApiError";

export type ProductSort = "rating" | "price-asc" | "price-desc";

export interface ProductFilters {
  /** Slug de categoría (fitness, running...) o texto libre. */
  category?: string;
  /** Búsqueda por nombre o categoría. */
  search?: string;
  /** Público objetivo (página Hombre / Mujer). */
  audience?: Audience;
  sort?: ProductSort;
}

const BADGE_BASE =
  "absolute top-3.5 left-3.5 z-10 text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm";

/** badge_tone guarda el significado; aquí se traduce a clases de Tailwind. */
const BADGE_CLASS: Record<string, string> = {
  nuevo: `${BADGE_BASE} bg-secondary text-white`,
  oferta: `${BADGE_BASE} bg-primary text-white`,
  soporte: `${BADGE_BASE} bg-primary text-white`,
  tecnico: `${BADGE_BASE} bg-slate-900 dark:bg-slate-700 text-white`,
  bestseller: `${BADGE_BASE} bg-slate-900 dark:bg-slate-700 text-white`,
  tendencia: `${BADGE_BASE} bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white`,
};

const BORDER_CLASS = "border border-slate-300";

interface CatalogRow extends RowDataPacket {
  id: string;
  name: string;
  category_slug: string;
  category_label: string;
  rating: number;
  badge_label: string | null;
  badge_tone: string | null;
  image_url: string;
  default_size: string;
  sizes: string | null;
  price: number;
  original_price: number | null;
  audience: Audience;
  garment_type: string | null;
  /** Columna SET de MySQL: llega como "ripstop,dwr". */
  features: string | null;
  subtitle: string | null;
  description: string | null;
  favorited: number;
}

interface ColorRow extends RowDataPacket {
  product_id: string;
  color_hex: string;
  has_border: number;
}

/** Colores de todos los productos, agrupados por producto. */
async function loadColors(): Promise<Map<string, ProductColor[]>> {
  const list = await rows<ColorRow>(
    "SELECT product_id, color_hex, has_border FROM product_colors ORDER BY product_id, sort_order, color_hex",
  );
  const byProduct = new Map<string, ProductColor[]>();

  for (const color of list) {
    const bucket = byProduct.get(color.product_id) ?? [];
    bucket.push({
      value: color.color_hex,
      ...(color.has_border ? { className: BORDER_CLASS } : {}),
    });
    byProduct.set(color.product_id, bucket);
  }

  return byProduct;
}

function toProduct(row: CatalogRow, colors: Map<string, ProductColor[]>): Product {
  const tone = row.badge_tone ?? "";
  return {
    id: row.id,
    name: row.name,
    category: row.category_label,
    categorySlug: row.category_slug,
    rating: Number(row.rating),
    badge: {
      label: row.badge_label ?? "",
      className: BADGE_CLASS[tone] ?? `${BADGE_BASE} bg-slate-900 text-white`,
    },
    image: row.image_url,
    favorited: Number(row.favorited) === 1,
    sizes: (row.sizes ?? "").split(",").filter(Boolean),
    defaultSize: row.default_size,
    colors: colors.get(row.id) ?? [],
    price: Number(row.price),
    ...(row.original_price !== null ? { originalPrice: Number(row.original_price) } : {}),
    audience: row.audience,
    ...(row.garment_type ? { garmentType: row.garment_type } : {}),
    features: (row.features ?? "").split(",").filter(Boolean),
    ...(row.subtitle ? { subtitle: row.subtitle } : {}),
    ...(row.description ? { description: row.description } : {}),
  };
}

/**
 * Consulta base: v_catalog ya une categoría, tallas y colores, y la columna
 * calculada `favorited` dice si el usuario de la sesión lo tiene marcado.
 */
const CATALOG_SELECT = `
  SELECT v.*,
         EXISTS (
           SELECT 1 FROM favorites f
            WHERE f.product_id = v.id AND f.user_id = ?
         ) AS favorited
    FROM v_catalog v`;

export async function listProducts(
  filters: ProductFilters = {},
  userId?: string,
): Promise<Product[]> {
  const { category, search, audience, sort = "rating" } = filters;
  const conditions: string[] = [];
  const params: unknown[] = [userId ?? null];

  if (category) {
    conditions.push("(v.category_slug = ? OR v.category_label LIKE CONCAT('%', ?, '%'))");
    params.push(category, category);
  }

  if (audience) {
    conditions.push("v.audience = ?");
    params.push(audience);
  }

  if (search) {
    conditions.push(
      "(v.name LIKE CONCAT('%', ?, '%') OR v.category_label LIKE CONCAT('%', ?, '%'))",
    );
    params.push(search, search);
  }

  const where = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const order =
    sort === "price-asc"
      ? " ORDER BY v.price ASC, v.name ASC"
      : sort === "price-desc"
        ? " ORDER BY v.price DESC, v.name ASC"
        : " ORDER BY v.rating DESC, v.name ASC";

  const [catalog, colors] = await Promise.all([
    rows<CatalogRow>(`${CATALOG_SELECT}${where}${order}`, params),
    loadColors(),
  ]);

  return catalog.map((row) => toProduct(row, colors));
}

export async function getProduct(id: string, userId?: string): Promise<Product> {
  const [row] = await rows<CatalogRow>(`${CATALOG_SELECT} WHERE v.id = ? LIMIT 1`, [
    userId ?? null,
    id,
  ]);

  if (!row) {
    throw ApiError.notFound(`No existe el producto "${id}"`);
  }

  const colors = await loadColors();
  return toProduct(row, colors);
}

export async function listCategories(): Promise<Category[]> {
  const list = await rows<RowDataPacket & { slug: string; label: string; items_count: number }>(
    "SELECT slug, label, items_count FROM categories ORDER BY sort_order, id",
  );

  return list.map((row) => ({
    slug: row.slug,
    label: row.label,
    items: Number(row.items_count),
  }));
}
