// services/cart.service.ts
// Carrito en memoria (sesión del servidor). En producción se sustituiría
// por un almacén persistente sin cambiar la interfaz de este servicio.
import { findProductById } from "../data/products";
import type { CartItem } from "../types/product";
import { ApiError } from "../utils/ApiError";

export interface CartLineInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface CartView {
  items: CartItem[];
  count: number;
  total: number;
}

const lines = new Map<string, CartItem>();

const key = (productId: string, size: string, color: string): string =>
  `${productId}|${size}|${color}`;

export function addLine(input: CartLineInput): CartView {
  const product = findProductById(input.productId);
  if (!product) {
    throw ApiError.badRequest(`Producto desconocido: ${input.productId}`);
  }
  if (!product.sizes.includes(input.size)) {
    throw ApiError.badRequest(
      `La talla "${input.size}" no está disponible para ${product.name}`,
      product.sizes,
    );
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 99) {
    throw ApiError.badRequest("La cantidad debe estar entre 1 y 99");
  }

  const lineKey = key(input.productId, input.size, input.color);
  const existing = lines.get(lineKey);

  lines.set(lineKey, {
    productId: input.productId,
    size: input.size,
    color: input.color,
    quantity: (existing?.quantity ?? 0) + input.quantity,
    unitPrice: product.price,
  });

  return getCart();
}

export function getCart(): CartView {
  const items = [...lines.values()];
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { items, count, total: Number(total.toFixed(2)) };
}

export function removeLine(productId: string): boolean {
  const found = [...lines.entries()].some(([lineKey, item], _index) => {
    if (item.productId !== productId) return false;
    lines.delete(lineKey);
    return true;
  });

  if (!found) {
    throw ApiError.notFound(`El producto "${productId}" no está en el carrito`);
  }
  return true;
}

export function clearCart(): void {
  lines.clear();
}
