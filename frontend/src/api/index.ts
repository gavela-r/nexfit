// api/index.ts
// Cliente HTTP contra el backend NEXFIT (Express + TypeScript + MySQL).
// Si la API no está disponible, el frontend sigue funcionando con los datos
// locales del catálogo para no dejar la tienda en blanco.
import { products as localProducts, type Audience, type Product } from "../data/products";
import { matchesQuery } from "../utils/search";

const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

/** Token del carrito de invitado (lo genera el backend en la primera visita). */
const CART_TOKEN_KEY = "nexfit_cart_token";

export interface CartItemInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface CartItemView extends CartItemInput {
  unitPrice: number;
  name?: string;
  image?: string;
  /** Etiqueta de la categoría para el badge del panel. */
  category?: string;
  /** Nombre comercial del color. */
  colorName?: string;
}

export interface CartView {
  items: CartItemView[];
  count: number;
  total: number;
  cartToken: string | null;
}

export interface FavoritesView {
  productIds: string[];
  count: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

export interface ApiErrorBody {
  ok: boolean;
  error: string;
  details?: string[];
}

/** Error de la API con el mensaje que devuelve el backend. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

interface RequestInitWithToken extends RequestInit {
  /** Token de sesión, enviado como cabecero Authorization: Bearer <token>. */
  token?: string;
}

async function request<T>(path: string, init: RequestInitWithToken = {}): Promise<T> {
  const { token, headers, ...rest } = init;

  const response = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  const body = (await response.json().catch(() => null)) as (ApiResponse<T> & ApiErrorBody) | null;

  if (!response.ok || !body?.ok) {
    throw new ApiRequestError(
      response.status,
      body?.error ?? `API ${path} → ${response.status}`,
      body?.details ?? [],
    );
  }

  return body.data;
}

// --------------------------------------------------------------- Carrito

/** Token de la cesta de invitado guardado en el navegador. */
export function getGuestCartToken(): string | null {
  return window.localStorage.getItem(CART_TOKEN_KEY);
}

function forgetGuestCartToken(): void {
  window.localStorage.removeItem(CART_TOKEN_KEY);
}

/**
 * Petición de carrito: añade el token de invitado y guarda el que devuelve el
 * backend la primera vez (así el invitado conserva su cesta entre recargas).
 */
async function cartRequest<T>(path: string, init: RequestInitWithToken = {}): Promise<T> {
  const guestToken = getGuestCartToken();
  const data = await request<T>(path, {
    ...init,
    headers: {
      ...(guestToken ? { "X-Cart-Token": guestToken } : {}),
      ...init.headers,
    },
  });

  const returnedToken = (data as { cartToken?: string | null } | null)?.cartToken;
  if (returnedToken) window.localStorage.setItem(CART_TOKEN_KEY, returnedToken);

  return data;
}

/** Carrito actual del usuario (o del invitado). */
export async function getCart(token?: string): Promise<CartView> {
  return cartRequest<CartView>("/cart", { token });
}

/** Añade una línea al carrito del backend (optimista en la interfaz). */
export async function addCartItem(item: CartItemInput, token?: string): Promise<CartView> {
  return cartRequest<CartView>("/cart/items", {
    method: "POST",
    body: JSON.stringify(item),
    token,
  });
}

/** Cambia la cantidad de una línea concreta (misma talla y color). */
export async function updateCartItem(
  productId: string,
  line: Pick<CartItemInput, "size" | "color" | "quantity">,
  token?: string,
): Promise<CartView> {
  return cartRequest<CartView>(`/cart/items/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: JSON.stringify(line),
    token,
  });
}

/** Quita una línea (o todas las del producto si no se indica talla y color). */
export async function removeCartItem(
  productId: string,
  token?: string,
  line: { size?: string; color?: string } = {},
): Promise<CartView> {
  const params = new URLSearchParams();
  if (line.size) params.set("size", line.size);
  if (line.color) params.set("color", line.color);
  const query = params.toString();

  return cartRequest<CartView>(
    `/cart/items/${encodeURIComponent(productId)}${query ? `?${query}` : ""}`,
    { method: "DELETE", token },
  );
}

/** Vacía el carrito. */
export async function clearCart(token?: string): Promise<CartView> {
  return cartRequest<CartView>("/cart", { method: "DELETE", token });
}

// -------------------------------------------------------------- Favoritos

/** Productos favoritos del usuario (requiere sesión). */
export async function getFavorites(token: string): Promise<FavoritesView> {
  return request<FavoritesView>("/favorites", { token });
}

export async function addFavorite(token: string, productId: string): Promise<FavoritesView> {
  return request<FavoritesView>("/favorites", {
    method: "POST",
    body: JSON.stringify({ productId }),
    token,
  });
}

export async function removeFavorite(token: string, productId: string): Promise<FavoritesView> {
  return request<FavoritesView>(`/favorites/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
}

// --------------------------------------------------------------- Catálogo

/** Catálogo completo (con respaldo local si el backend está apagado). */
export async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  try {
    const products = await request<Product[]>("/products", { signal });
    return products.length > 0 ? products : localProducts;
  } catch {
    return localProducts;
  }
}

/**
 * Catálogo de un público concreto (`GET /api/products?audience=hombre`).
 * Si el backend está apagado (o es anterior y no conoce `audience`) se
 * filtra la copia local.
 */
export async function getProductsByAudience(
  audience: Audience,
  signal?: AbortSignal,
): Promise<Product[]> {
  try {
    const products = await request<Product[]>(`/products?audience=${audience}`, { signal });
    const matching = products.filter((product) => product.audience === audience);
    if (matching.length > 0) return matching;
  } catch (error) {
    if (signal?.aborted) throw error;
  }
  return localProducts.filter((product) => product.audience === audience);
}

/**
 * Búsqueda de productos por texto (`GET /api/products?search=`).
 * Si el backend está apagado se filtra el catálogo local con el mismo criterio.
 */
export async function searchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const term = query.trim();
  if (!term) return [];

  try {
    return await request<Product[]>(`/products?search=${encodeURIComponent(term)}`, { signal });
  } catch (error) {
    // Si la petición se ha cancelado (respuesta obsoleta) no devolvemos nada.
    if (signal?.aborted) throw error;

    return localProducts.filter(
      (product) => matchesQuery(product.name, term) || matchesQuery(product.category, term),
    );
  }
}

// -------------------------------------------------------------- Autenticación

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

/**
 * Crea la cuenta e inicia sesión (201). Si hay una cesta de invitado, sus
 * líneas pasan a la cuenta. Lanza ApiRequestError si el correo ya existe.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const guestToken = getGuestCartToken();
  const session = await request<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      ...(guestToken ? { cartToken: guestToken } : {}),
    }),
  });
  forgetGuestCartToken();
  return session;
}

/** Inicia sesión (200). Lanza ApiRequestError con el mensaje del backend. */
export async function loginUser(email: string, password: string): Promise<AuthSession> {
  const guestToken = getGuestCartToken();
  const session = await request<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, ...(guestToken ? { cartToken: guestToken } : {}) }),
  });
  forgetGuestCartToken();
  return session;
}

/** Cierra la sesión del token en el servidor. */
export async function logoutUser(token: string): Promise<void> {
  await request<{ loggedOut: boolean }>("/auth/logout", { method: "POST", token });
}

/** Perfil de la sesión abierta (401 si el token ya no es válido). */
export async function getSessionUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { token });
}

/** Comprueba que la API está viva (usado en la barra de estado). */
export async function getHealth(): Promise<{ status: string; uptime: number }> {
  return request<{ status: string; uptime: number }>("/health");
}
