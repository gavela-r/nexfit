// services/favorites.service.ts
// Favoritos del usuario en MySQL (tabla favorites).
import type { RowDataPacket } from "mysql2";
import { run, rows } from "../db/pool";
import { ApiError } from "../utils/ApiError";

export interface FavoritesView {
  productIds: string[];
  count: number;
}

async function readFavorites(userId: string): Promise<FavoritesView> {
  const list = await rows<RowDataPacket & { product_id: string }>(
    "SELECT product_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC, product_id",
    [userId],
  );
  const productIds = list.map((row) => row.product_id);
  return { productIds, count: productIds.length };
}

export async function listFavorites(userId: string): Promise<FavoritesView> {
  return readFavorites(userId);
}

export async function addFavorite(userId: string, productId: string): Promise<FavoritesView> {
  const [product] = await rows<RowDataPacket & { id: string }>(
    "SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1",
    [productId],
  );
  if (!product) {
    throw ApiError.badRequest(`Producto desconocido: ${productId}`);
  }

  // ON DUPLICATE KEY: si ya era favorito no se duplica ni falla.
  await run(
    "INSERT INTO favorites (user_id, product_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE product_id = VALUES(product_id)",
    [userId, productId],
  );

  return readFavorites(userId);
}

export async function removeFavorite(userId: string, productId: string): Promise<FavoritesView> {
  await run("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [userId, productId]);
  return readFavorites(userId);
}
