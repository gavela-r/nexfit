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

// ------------------------------------------------------- Pedidos y pago

export interface OrderLineView {
  /** id de order_items (lo usan las devoluciones). */
  id: number;
  productId: string | null;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderView {
  orderNumber: string;
  status: "pendiente" | "pagado" | "enviado" | "entregado" | "cancelado" | "devuelto";
  subtotal: number;
  shippingCost: number;
  discount: number;
  /** Cupón del descuento: CLUB10 o MOVE15 (null si no hubo descuento). */
  couponCode: string | null;
  total: number;
  currency: string;
  paymentMethod: string | null;
  email: string | null;
  shipping: {
    name: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
  };
  items: OrderLineView[];
  createdAt: string;
}

/** Convierte la cesta en pedido y devuelve la URL de pago de Stripe Checkout. */
export async function createCheckoutSession(
  token: string,
  couponCode?: string,
): Promise<{ url: string; orderNumber: string }> {
  return request<{ url: string; orderNumber: string }>("/checkout/session", {
    method: "POST",
    body: JSON.stringify(couponCode ? { couponCode } : {}),
    token,
  });
}

// ---------------------------------------------------------------- Cupones

export interface Coupon {
  code: string;
  percent: number;
  title: string;
  description: string;
  /** Se aplica sin escribir el código (CLUB10). */
  automatic: boolean;
}

export type CouponStatus = "activo" | "disponible" | "usado" | "no_disponible";

/** Comprueba un código para el usuario (ApiRequestError con el motivo si no vale). */
export async function validateCoupon(token: string, code: string): Promise<Coupon> {
  return request<Coupon>("/coupons/validate", {
    method: "POST",
    body: JSON.stringify({ code }),
    token,
  });
}

/** Cupones de la tienda con su estado para el usuario (página del Club). */
export async function getCoupons(token: string): Promise<(Coupon & { status: CouponStatus })[]> {
  return request<(Coupon & { status: CouponStatus })[]>("/coupons", { token });
}

/** Texto del descuento de un pedido según su cupón. */
export function discountLabel(couponCode: string | null): string {
  return couponCode === "MOVE15" ? "Cupón bienvenida MOVE15 (15%)" : "Descuento Club 10%";
}

/** Al volver de Stripe: verifica el pago y devuelve el pedido. */
export async function confirmCheckout(token: string, sessionId: string): Promise<OrderView> {
  return request<OrderView>("/checkout/confirm", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
    token,
  });
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

/** Talla habitual del usuario (null = sin indicar). */
export interface UserSizes {
  top: string | null;
  bottom: string | null;
  shoe: string | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  sizes: UserSizes;
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

/** Cambia el nombre y el correo de la cuenta. */
export async function updateProfile(token: string, name: string, email: string): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify({ name, email }),
    token,
  });
}

/** Guarda la talla habitual y devuelve el perfil actualizado. */
export async function updateSizes(token: string, sizes: UserSizes): Promise<AuthUser> {
  return request<AuthUser>("/auth/sizes", {
    method: "PATCH",
    body: JSON.stringify(sizes),
    token,
  });
}

// ------------------------------------------------------------ Direcciones

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string | null;
  addressLine: string;
  city: string;
  postalCode: string;
  country: "ES" | "PT";
  isDefault: boolean;
}

export type AddressInput = Omit<Address, "id" | "isDefault"> & { isDefault?: boolean };

/** Todas devuelven la lista actualizada (la predeterminada primero). */
export async function getAddresses(token: string): Promise<Address[]> {
  return request<Address[]>("/addresses", { token });
}

export async function createAddress(token: string, address: AddressInput): Promise<Address[]> {
  return request<Address[]>("/addresses", {
    method: "POST",
    body: JSON.stringify(address),
    token,
  });
}

export async function updateAddress(
  token: string,
  id: number,
  address: AddressInput,
): Promise<Address[]> {
  return request<Address[]>(`/addresses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(address),
    token,
  });
}

export async function deleteAddress(token: string, id: number): Promise<Address[]> {
  return request<Address[]>(`/addresses/${id}`, { method: "DELETE", token });
}

export async function setDefaultAddress(token: string, id: number): Promise<Address[]> {
  return request<Address[]>(`/addresses/${id}/default`, { method: "POST", token });
}

/** Cambia la contraseña (cierra las sesiones de otros dispositivos). */
export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await request<{ changed: boolean }>("/auth/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
    token,
  });
}

/** Pedidos del usuario, del más reciente al más antiguo. */
export async function getOrders(token: string): Promise<OrderView[]> {
  return request<OrderView[]>("/orders", { token });
}

// ------------------------------------------------- Devoluciones y cambios

export type ReturnKind = "devolucion" | "cambio";
export type ReturnReason = "talla" | "defecto" | "no_esperado" | "otro";

export interface ReturnableItem {
  orderItemId: number;
  productId: string | null;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  purchased: number;
  /** Unidades que aún se pueden devolver o cambiar. */
  returnable: number;
  /** Tallas del producto (para elegir la nueva en un cambio). */
  sizes: string[];
}

export interface EligibleOrder {
  orderNumber: string;
  createdAt: string;
  deadline: string;
  items: ReturnableItem[];
}

export interface ReturnView {
  returnNumber: string;
  orderNumber: string;
  type: ReturnKind;
  status: "solicitada" | "aprobada" | "recibida" | "completada" | "rechazada";
  reason: ReturnReason;
  comments: string | null;
  refundAmount: number;
  createdAt: string;
  items: {
    productName: string;
    size: string;
    color: string;
    quantity: number;
    newSize: string | null;
  }[];
}

export interface ReturnRequest {
  orderNumber: string;
  type: ReturnKind;
  reason: ReturnReason;
  comments?: string;
  items: { orderItemId: number; quantity: number; newSize?: string }[];
}

/** Solicitudes del usuario y pedidos que aún admiten devolución. */
export async function getReturns(
  token: string,
): Promise<{ returns: ReturnView[]; eligibleOrders: EligibleOrder[] }> {
  return request<{ returns: ReturnView[]; eligibleOrders: EligibleOrder[] }>("/returns", { token });
}

export async function createReturn(token: string, body: ReturnRequest): Promise<ReturnView> {
  return request<ReturnView>("/returns", { method: "POST", body: JSON.stringify(body), token });
}

export interface CategorySummary {
  slug: string;
  label: string;
  /** Número real de productos activos de la disciplina. */
  items: number;
}

/** Disciplinas con su número de productos (tarjetas de la portada). */
export async function getCategories(signal?: AbortSignal): Promise<CategorySummary[]> {
  return request<CategorySummary[]>("/categories", { signal });
}

// ------------------------------------------------------- Ficha de producto

export interface ProductPageData {
  product: Product;
  /** Colores con su nombre comercial. */
  colors: { value: string; name: string; hasBorder: boolean }[];
  /** Tallas con sus unidades disponibles (0 = agotada). */
  sizes: { size: string; stock: number }[];
  related: Product[];
}

export type ReviewSort = "recientes" | "mejores" | "peores";

export interface PublicReview {
  author: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  mine: boolean;
}

export interface ProductReviews {
  average: number;
  count: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  reviews: PublicReview[];
  page: number;
  pages: number;
  canReview: boolean;
  myReview: { rating: number; title: string | null; comment: string | null } | null;
}

/** Datos de la ficha (#/producto/:id). Lanza ApiRequestError 404 si no existe. */
export async function getProductPage(
  id: string,
  token?: string,
  signal?: AbortSignal,
): Promise<ProductPageData> {
  return request<ProductPageData>(`/products/${encodeURIComponent(id)}/page`, { token, signal });
}

/** Reseñas públicas de un producto (5 por página). */
export async function getProductReviews(
  id: string,
  options: { sort?: ReviewSort; page?: number; token?: string } = {},
): Promise<ProductReviews> {
  const params = new URLSearchParams({
    sort: options.sort ?? "recientes",
    page: String(options.page ?? 1),
  });
  return request<ProductReviews>(`/products/${encodeURIComponent(id)}/reviews?${params}`, {
    token: options.token,
  });
}

// ----------------------------------------------------------------- Reseñas

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
  purchasedAt: string;
}

export interface MyReviews {
  reviews: ReviewView[];
  pending: PendingReview[];
}

export async function getMyReviews(token: string): Promise<MyReviews> {
  return request<MyReviews>("/reviews/mine", { token });
}

/** Crea o actualiza la reseña de una prenda comprada. */
export async function saveReview(
  token: string,
  review: { productId: string; rating: number; title?: string; comment?: string },
): Promise<MyReviews> {
  return request<MyReviews>("/reviews", { method: "POST", body: JSON.stringify(review), token });
}

export async function deleteReview(token: string, productId: string): Promise<MyReviews> {
  return request<MyReviews>(`/reviews/${encodeURIComponent(productId)}`, {
    method: "DELETE",
    token,
  });
}

/** Comprueba que la API está viva (usado en la barra de estado). */
export async function getHealth(): Promise<{ status: string; uptime: number }> {
  return request<{ status: string; uptime: number }>("/health");
}
