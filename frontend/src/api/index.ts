// api/index.ts
// Cliente HTTP contra el backend NEXFIT (Express + TypeScript).
// Si la API no está disponible, el frontend sigue funcionando con los datos
// locales del catálogo para no dejar la tienda en blanco.
import { products as localProducts, type Product } from "../data/products";
import { matchesQuery } from "../utils/search";

const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export interface CartItemInput {
  productId: string;
  size: string;
  color: string;
  quantity: number;
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

/** Añade una línea al carrito del backend (optimista en la interfaz). */
export async function addCartItem(item: CartItemInput): Promise<void> {
  await request<{ count: number; total: number }>("/cart/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
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

/** Crea la cuenta e inicia sesión (201). Lanza ApiRequestError si el correo ya existe. */
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  return request<AuthSession>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

/** Inicia sesión (200). Lanza ApiRequestError con el mensaje del backend. */
export async function loginUser(email: string, password: string): Promise<AuthSession> {
  return request<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** Cierra la sesión del token en el servidor. */
export async function logoutUser(token: string): Promise<void> {
  await request<{ loggedOut: boolean }>("/auth/logout", { method: "POST", token });
}

/** Perfil de la sesión abierta (401 si el token ya no es válido). */
export async function getSessionUser(token: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { token });
}

/** Comprueba que la API esté viva (usado en la barra de estado). */
export async function getHealth(): Promise<{ status: string; uptime: number }> {
  return request<{ status: string; uptime: number }>("/health");
}
