// CartDrawer
// Panel lateral de la cesta: se abre desde el botón del carrito de la cabecera.
// Muestra las líneas reales del backend (talla, color, cantidad), el progreso
// hacia el envío gratis, una sugerencia para completar la equipación y el
// resumen con el descuento del Club antes de tramitar el pedido.
import { useEffect } from "react";
import type { CartItemInput, CartItemView, CartView } from "../api";
import { products } from "../data/products";

/** Clave única de una línea: mismo producto, talla y color. */
export function cartLineKey(item: Pick<CartItemView, "productId" | "size" | "color">): string {
  return `${item.productId}|${item.size}|${item.color}`;
}

/** Importe en formato español: 116,01 €. */
function money(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

const FREE_SHIPPING_FROM = 50;
const SHIPPING_COST = 4.95;
const CLUB_DISCOUNT = 0.1;

const PAYMENT_BADGES = ["APPLE PAY", "VISA", "MASTERCARD", "PAYPAL"];

interface CartDrawerProps {
  open: boolean;
  cart: CartView | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  favoriteIds: string[];
  /** Línea que está esperando respuesta del backend (`cartLineKey`). */
  busyLine: string | null;
  onClose: () => void;
  onRetry: () => void;
  onOpenAuth: () => void;
  onGoShopping: () => void;
  onQuantityChange: (item: CartItemView, quantity: number) => void;
  onRemove: (item: CartItemView) => void;
  onToggleFavorite: (productId: string) => void;
  onAddUpsell: (item: CartItemInput) => void;
  onCheckout: (total: number) => void;
  onViewDetails: () => void;
}

export function CartDrawer({
  open,
  cart,
  loading,
  error,
  isAuthenticated,
  favoriteIds,
  busyLine,
  onClose,
  onRetry,
  onOpenAuth,
  onGoShopping,
  onQuantityChange,
  onRemove,
  onToggleFavorite,
  onAddUpsell,
  onCheckout,
  onViewDetails,
}: CartDrawerProps) {
  // Escape cierra el panel y, mientras está abierto, la página no hace scroll.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = cart?.items ?? [];
  const count = cart?.count ?? 0;
  const subtotal = cart?.total ?? 0;

  const discount = isAuthenticated ? Math.round(subtotal * CLUB_DISCOUNT * 100) / 100 : 0;
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_FROM ? SHIPPING_COST : 0;
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;

  const freeShipping = subtotal >= FREE_SHIPPING_FROM;
  const progress =
    subtotal >= FREE_SHIPPING_FROM
      ? 100
      : Math.min(99, Math.round((subtotal / FREE_SHIPPING_FROM) * 100));

  const inCart = new Set(items.map((item) => item.productId));
  const upsell =
    [...products]
      .filter((product) => !inCart.has(product.id))
      .sort((a, b) => a.price - b.price)[0] ?? null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Fondo oscuro: un clic cierra la cesta */}
      <button
        aria-label="Cerrar la cesta"
        className="cart-overlay-enter absolute inset-0 h-full w-full cursor-default bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="cart-drawer-title"
        aria-modal="true"
        className="cart-drawer-enter absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col bg-white shadow-2xl dark:bg-slate-900"
        role="dialog"
      >
        {/* ------------------------------------------------------- cabecera */}
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-primary dark:bg-primary/15">
            <span className="material-symbols-outlined text-[23px]">shopping_bag</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="font-headline-sm text-xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                id="cart-drawer-title"
              >
                Tu Cesta
              </h2>
              {count > 0 && (
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-primary dark:bg-primary/15">
                  {count} {count === 1 ? "prenda" : "prendas"}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              Listo para tramitar tu pedido
            </p>
          </div>
          <button
            aria-label="Cerrar la cesta"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        {/* --------------------------------------------------------- contenido */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {loading && !cart && <CartSkeleton />}

          {error && (
            <div
              aria-live="polite"
              className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <span className="material-symbols-outlined text-[16px]">error</span>
              <div className="flex-1">
                <p>{error}</p>
                <button
                  className="mt-1 font-bold underline underline-offset-2"
                  onClick={onRetry}
                  type="button"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!loading && cart && count === 0 && <EmptyCart onGoShopping={onGoShopping} />}

          {count > 0 && (
            <>
              {/* Progreso hacia el envío gratis */}
              <div
                className={`rounded-xl border px-3 py-2.5 ${
                  freeShipping
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                    : "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      freeShipping ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
                    }`}
                  >
                    {freeShipping ? "check_circle" : "local_shipping"}
                  </span>
                  <p
                    className={`text-[11px] font-bold ${
                      freeShipping
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {freeShipping
                      ? "¡Envío gratis asegurado!"
                      : `Te faltan ${money(FREE_SHIPPING_FROM - subtotal)} para el envío gratis`}
                    {freeShipping && <span className="font-medium"> (Superas 50 €)</span>}
                  </p>
                  <span
                    className={`ml-auto text-[10px] font-extrabold ${
                      freeShipping
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {progress}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Líneas de la cesta */}
              <div className="mt-3">
                {items.map((item) => {
                  const key = cartLineKey(item);
                  const busy = busyLine === key;
                  const isFavorite = favoriteIds.includes(item.productId);
                  const lineTotal = item.unitPrice * item.quantity;
                  const category = item.category?.split("/")[0]?.trim();

                  return (
                    <article
                      className={`flex gap-3 border-b border-slate-100 py-4 transition-opacity last:border-b-0 dark:border-slate-800 ${
                        busy ? "opacity-60" : ""
                      }`}
                      key={key}
                    >
                      <div className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        {item.image ? (
                          <img
                            alt={item.name ?? "Producto NEXFIT"}
                            className="h-full w-full object-cover"
                            loading="lazy"
                            src={item.image}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-[24px]">checkroom</span>
                          </span>
                        )}
                        {category && (
                          <span className="absolute left-1 top-1 max-w-[68px] truncate rounded bg-white/95 px-1.5 py-0.5 text-[7px] font-extrabold uppercase tracking-wider text-slate-700 shadow-sm">
                            {category}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-[12.5px] font-bold leading-snug text-slate-900 dark:text-white">
                            {item.name ?? "Producto NEXFIT"}
                          </h3>
                          <p className="shrink-0 text-[12.5px] font-extrabold text-slate-900 dark:text-white">
                            {money(lineTotal)}
                          </p>
                        </div>

                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                          <span>
                            Talla{" "}
                            <b className="font-bold text-slate-700 dark:text-slate-200">
                              {item.size}
                            </b>
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="flex items-center gap-1.5">
                            Color
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-slate-300 dark:ring-slate-600"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.colorName && (
                              <b className="font-bold text-slate-700 dark:text-slate-200">
                                {item.colorName}
                              </b>
                            )}
                          </span>
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                              aria-label={`Quitar una unidad de ${item.name ?? "este producto"}`}
                              className="flex h-full w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                              disabled={busy || item.quantity <= 1}
                              onClick={() => onQuantityChange(item, item.quantity - 1)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="w-7 text-center text-xs font-extrabold text-slate-900 dark:text-white">
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Añadir una unidad de ${item.name ?? "este producto"}`}
                              className="flex h-full w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                              disabled={busy || item.quantity >= 99}
                              onClick={() => onQuantityChange(item, item.quantity + 1)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                              aria-pressed={isFavorite}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                                isFavorite
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary dark:border-slate-700 dark:text-slate-400"
                              }`}
                              onClick={() => onToggleFavorite(item.productId)}
                              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                              type="button"
                            >
                              <span
                                className="material-symbols-outlined text-[17px]"
                                style={{
                                  fontVariationSettings: isFavorite
                                    ? '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24'
                                    : undefined,
                                }}
                              >
                                favorite
                              </span>
                            </button>
                            <button
                              aria-label={`Eliminar ${item.name ?? "este producto"} de la cesta`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-900/60 dark:hover:bg-red-950/40"
                              disabled={busy}
                              onClick={() => onRemove(item)}
                              title="Eliminar de la cesta"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[17px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Sugerencia para completar la equipación */}
              {upsell && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      auto_awesome
                    </span>
                    Completa tu equipación
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      alt={upsell.name}
                      className="h-16 w-14 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                      src={upsell.image}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-snug text-slate-900 dark:text-white">
                        {upsell.name}{" "}
                        <span className="whitespace-nowrap font-extrabold text-primary">
                          (+{money(upsell.price)})
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                        {upsell.category}. Añádelo a tu pedido y completa tu equipación.
                      </p>
                    </div>
                    <button
                      className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      onClick={() =>
                        onAddUpsell({
                          productId: upsell.id,
                          size: upsell.defaultSize,
                          color: upsell.colors[0]?.value ?? "",
                          quantity: 1,
                        })
                      }
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Añadir
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ----------------------------------------------------------- resumen */}
        {count > 0 && (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-5 pb-4 pt-3 dark:border-slate-800 dark:bg-slate-900">
            <dl className="space-y-1.5 text-[11.5px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-100">
                  {money(subtotal)}
                </dd>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <dt className="flex items-center gap-1.5">
                    Descuento Club 10%
                    <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-extrabold tracking-wide dark:bg-emerald-950/60">
                      CLUB10
                    </span>
                  </dt>
                  <dd className="font-semibold">−{money(discount)}</dd>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Descuento Club 10%</dt>
                  <dd>
                    <button
                      className="font-bold text-primary hover:underline"
                      onClick={onOpenAuth}
                      type="button"
                    >
                      Inicia sesión
                    </button>
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Envío estándar (24-48h)</dt>
                <dd
                  className={
                    shipping === 0
                      ? "font-bold text-emerald-600 dark:text-emerald-400"
                      : "font-semibold text-slate-800 dark:text-slate-100"
                  }
                >
                  {shipping === 0 ? "GRATIS" : money(shipping)}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-end justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
              <div>
                <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">
                  Total a pagar
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">IVA incluido (21%)</p>
              </div>
              <p className="font-headline-sm text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {money(total)}
              </p>
            </div>

            {/* Sin cuenta no se puede tramitar: se avisa y se ofrece el acceso */}
            {!isAuthenticated && (
              <p
                className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
                id="cart-auth-required"
              >
                <span className="material-symbols-outlined mt-px text-[13px]">lock</span>
                <span>
                  Necesitas una cuenta para tramitar el pedido.{" "}
                  <button
                    className="font-extrabold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-200"
                    onClick={onOpenAuth}
                    type="button"
                  >
                    Inicia sesión o regístrate
                  </button>
                  .
                </span>
              </p>
            )}

            <button
              aria-describedby={!isAuthenticated ? "cart-auth-required" : undefined}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-px hover:bg-[#F04A10] hover:shadow-xl hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
              onClick={() => onCheckout(total)}
              type="button"
            >
              Tramitar Pedido ({money(total)})
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={onViewDetails}
              type="button"
            >
              Ver Cesta Detallada
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-[13px] text-emerald-500">
                verified_user
              </span>
              Garantía de 30 días de prueba · Devolución gratuita
            </p>

            <div className="mt-2.5 flex items-center justify-center gap-1.5">
              {PAYMENT_BADGES.map((badge) => (
                <span
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-[7.5px] font-extrabold tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  key={badge}
                >
                  {badge}
                </span>
              ))}
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}

function EmptyCart({ onGoShopping }: { onGoShopping: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <span className="material-symbols-outlined text-[30px]">shopping_bag</span>
      </span>
      <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">
        Tu cesta está vacía
      </h3>
      <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Añade tus prendas favoritas y vuelve cuando quieras: guardamos la cesta por ti.
      </p>
      <button
        className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800 dark:bg-primary dark:hover:bg-[#E04B16]"
        onClick={onGoShopping}
        type="button"
      >
        Explorar catálogo
      </button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800" />
      {[0, 1].map((row) => (
        <div className="flex gap-3" key={row}>
          <div className="h-24 w-[76px] shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-8 w-28 rounded-lg bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
