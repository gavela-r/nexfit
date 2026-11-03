// services/reviews.service.ts
// Reseñas de producto (tabla reviews). Solo puede valorar quien ha comprado
// la prenda (pedido pagado, enviado o entregado). Una reseña por usuario y
// producto: volver a enviarla la actualiza.
// Solo cuentan (y se publican) las reseñas de cuentas registradas y activas.
// Cada cambio recalcula products.rating mezclando la valoración inicial del
// catálogo (rating_base, que pesa como BASE_WEIGHT reseñas) con las reales,
// para que una sola opinión no dispare ni hunda la nota.
import type { RowDataPacket } from "mysql2/promise";
import { rows, run } from "../db/pool";
import { ApiError } from "../utils/ApiError";

const BASE_WEIGHT = 20;
const PURCHASED_STATUSES = "('pagado', 'enviado', 'entregado')";

export interface ReviewView {
  productId: string;
  productName: string;
  image: string;
  rating: number;
  title: string | null;
  comment: string | null;
  updatedAt: string;
}

export interface PendingReview {
  productId: string;
  productName: string;
  image: string;
  /** Fecha del último pedido en que se compró. */
  purchasedAt: string;
}

interface ReviewRow extends RowDataPacket {
  product_id: string;
  name: string;
  image_url: string;
  rating: number;
  title: string | null;
  comment: string | null;
  updated_at: Date;
}

interface PendingRow extends RowDataPacket {
  product_id: string;
  name: string;
  image_url: string;
  purchased_at: Date;
}

/** Productos que el usuario ha comprado (y siguen en el catálogo). */
async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const [row] = await rows<RowDataPacket & { total: number }>(
    `SELECT COUNT(*) AS total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ${PURCHASED_STATUSES}`,
    [userId, productId],
  );
  return Number(row?.total ?? 0) > 0;
}

/** Recalcula la nota pública del producto con sus reseñas. */
async function refreshRating(productId: string): Promise<void> {
  await run(
    `UPDATE products p
        LEFT JOIN (SELECT rv.product_id, SUM(rv.rating) AS total, COUNT(*) AS votes
                     FROM reviews rv
                     JOIN users u ON u.id = rv.user_id AND u.is_active = 1
                    WHERE rv.product_id = ? GROUP BY rv.product_id) r
               ON r.product_id = p.id
        SET p.rating = ROUND((p.rating_base * ${BASE_WEIGHT} + COALESCE(r.total, 0))
                             / (${BASE_WEIGHT} + COALESCE(r.votes, 0)), 1)
      WHERE p.id = ?`,
    [productId, productId],
  );
}

export type ReviewSort = "recientes" | "mejores" | "peores";

const REVIEW_ORDER: Record<ReviewSort, string> = {
  recientes: "r.updated_at DESC",
  mejores: "r.rating DESC, r.updated_at DESC",
  peores: "r.rating ASC, r.updated_at DESC",
};

const PAGE_SIZE = 5;

export interface PublicReview {
  /** Nombre y la inicial del apellido: «Laura M.». */
  author: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  /** Es la reseña del usuario de la sesión. */
  mine: boolean;
}

export interface ProductReviews {
  /** Media real de las reseñas (sin la valoración inicial del catálogo). */
  average: number;
  count: number;
  /** Número de reseñas con 5, 4, 3, 2 y 1 estrellas. */
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  reviews: PublicReview[];
  page: number;
  pages: number;
  /** El usuario de la sesión compró la prenda (puede valorarla). */
  canReview: boolean;
  /** Su reseña, para editarla desde la ficha. */
  myReview: { rating: number; title: string | null; comment: string | null } | null;
}

/** «Laura Martín López» → «Laura M.» (no se publica el apellido completo). */
function shortName(name: string): string {
  const [first = "Cliente", second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

/** Reseñas públicas de un producto, con resumen, orden y paginación. */
export async function listProductReviews(
  productId: string,
  options: { sort?: ReviewSort; page?: number; userId?: string } = {},
): Promise<ProductReviews> {
  const sort = options.sort ?? "recientes";
  const [summary] = await rows<
    RowDataPacket & {
      total: number;
      average: number | null;
      s1: number;
      s2: number;
      s3: number;
      s4: number;
      s5: number;
    }
  >(
    `SELECT COUNT(*) AS total, AVG(r.rating) AS average,
            SUM(r.rating = 1) AS s1, SUM(r.rating = 2) AS s2, SUM(r.rating = 3) AS s3,
            SUM(r.rating = 4) AS s4, SUM(r.rating = 5) AS s5
       FROM reviews r
       JOIN users u ON u.id = r.user_id AND u.is_active = 1
      WHERE r.product_id = ?`,
    [productId],
  );
  const count = Number(summary?.total ?? 0);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.floor(options.page ?? 1)), pages);

  const list = await rows<
    RowDataPacket & {
      user_id: string;
      name: string;
      rating: number;
      title: string | null;
      comment: string | null;
      created_at: Date;
    }
  >(
    `SELECT r.user_id, u.name, r.rating, r.title, r.comment, r.created_at
       FROM reviews r
       JOIN users u ON u.id = r.user_id AND u.is_active = 1
      WHERE r.product_id = ?
      ORDER BY ${REVIEW_ORDER[sort]}
      LIMIT ? OFFSET ?`,
    [productId, PAGE_SIZE, (page - 1) * PAGE_SIZE],
  );

  let canReview = false;
  let myReview: ProductReviews["myReview"] = null;
  if (options.userId) {
    canReview = await hasPurchased(options.userId, productId);
    const [mine] = await rows<
      RowDataPacket & { rating: number; title: string | null; comment: string | null }
    >("SELECT rating, title, comment FROM reviews WHERE user_id = ? AND product_id = ? LIMIT 1", [
      options.userId,
      productId,
    ]);
    if (mine) myReview = { rating: Number(mine.rating), title: mine.title, comment: mine.comment };
  }

  return {
    average:
      summary?.average !== null && summary?.average !== undefined
        ? Math.round(Number(summary.average) * 10) / 10
        : 0,
    count,
    distribution: {
      "1": Number(summary?.s1 ?? 0),
      "2": Number(summary?.s2 ?? 0),
      "3": Number(summary?.s3 ?? 0),
      "4": Number(summary?.s4 ?? 0),
      "5": Number(summary?.s5 ?? 0),
    },
    reviews: list.map((review) => ({
      author: shortName(review.name),
      rating: Number(review.rating),
      title: review.title,
      comment: review.comment,
      createdAt: new Date(review.created_at).toISOString(),
      mine: review.user_id === options.userId,
    })),
    page,
    pages,
    canReview,
    myReview,
  };
}

/** Reseñas escritas y prendas compradas que faltan por valorar. */
export async function getMyReviews(
  userId: string,
): Promise<{ reviews: ReviewView[]; pending: PendingReview[] }> {
  const reviews = await rows<ReviewRow>(
    `SELECT r.product_id, p.name, p.image_url, r.rating, r.title, r.comment, r.updated_at
       FROM reviews r
       JOIN products p ON p.id = r.product_id
      WHERE r.user_id = ?
      ORDER BY r.updated_at DESC`,
    [userId],
  );

  const pending = await rows<PendingRow>(
    `SELECT p.id AS product_id, p.name, p.image_url, MAX(o.created_at) AS purchased_at
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN products p ON p.id = oi.product_id
      WHERE o.user_id = ? AND o.status IN ${PURCHASED_STATUSES}
        AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.user_id = o.user_id AND r.product_id = p.id)
      GROUP BY p.id, p.name, p.image_url
      ORDER BY purchased_at DESC`,
    [userId],
  );

  return {
    reviews: reviews.map((review) => ({
      productId: review.product_id,
      productName: review.name,
      image: review.image_url,
      rating: Number(review.rating),
      title: review.title,
      comment: review.comment,
      updatedAt: new Date(review.updated_at).toISOString(),
    })),
    pending: pending.map((item) => ({
      productId: item.product_id,
      productName: item.name,
      image: item.image_url,
      purchasedAt: new Date(item.purchased_at).toISOString(),
    })),
  };
}

/** Crea o actualiza la reseña del usuario para un producto comprado. */
export async function saveReview(
  userId: string,
  input: { productId: string; rating: number; title?: string; comment?: string },
): Promise<{ reviews: ReviewView[]; pending: PendingReview[] }> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw ApiError.badRequest("La valoración debe ser de 1 a 5 estrellas");
  }
  if (!(await hasPurchased(userId, input.productId))) {
    throw ApiError.forbidden("Solo puedes valorar prendas que hayas comprado");
  }

  const title = input.title?.trim().slice(0, 80) || null;
  const comment = input.comment?.trim().slice(0, 1000) || null;

  await run(
    `INSERT INTO reviews (user_id, product_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), title = VALUES(title), comment = VALUES(comment)`,
    [userId, input.productId, input.rating, title, comment],
  );
  await refreshRating(input.productId);
  return getMyReviews(userId);
}

/** Borra la reseña del usuario (la prenda vuelve a «pendientes»). */
export async function deleteReview(
  userId: string,
  productId: string,
): Promise<{ reviews: ReviewView[]; pending: PendingReview[] }> {
  const result = await run("DELETE FROM reviews WHERE user_id = ? AND product_id = ?", [
    userId,
    productId,
  ]);
  if (result.affectedRows === 0) throw ApiError.notFound("No tienes una reseña de esta prenda");
  await refreshRating(productId);
  return getMyReviews(userId);
}
