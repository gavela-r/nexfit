// ProductPage
// Ficha de producto (#/producto/:id): foto con zoom, precio, color, talla con
// stock, cantidad, alta en la cesta y favorito; descripción y propiedades
// técnicas; opiniones de clientes (resumen, reparto por estrellas, orden y
// paginación, y formulario para quien la ha comprado) y prendas relacionadas.
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ApiRequestError,
  getProductPage,
  getProductReviews,
  saveReview,
  type AuthUser,
  type CartItemInput,
  type ProductPageData,
  type ProductReviews,
  type ReviewSort,
} from "../api";
import { formatPrice } from "../utils/format";
import { recordView } from "../utils/recentlyViewed";
import { preferredSizeFor, useUserSizes } from "../utils/sizes";
import { CatalogProductCard } from "./CatalogProductCard";
import { ReviewEditor, Stars, type ReviewDraft } from "./ReviewWidgets";

interface ProductPageProps {
  productId: string;
  user: AuthUser | null;
  token: string | null;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (item: CartItemInput) => Promise<boolean> | void;
  onOpenCart: () => void;
  onOpenLogin: () => void;
}

/** Páginas de catálogo de cada disciplina (las que no tienen, van al catálogo completo). */
const CATEGORY_PAGE: Record<string, string> = {
  futbol: "#/futbol",
  fitness: "#/fitness",
  crossfit: "#/crossfit",
  outdoor: "#/outdoor",
  running: "#/running",
  athleisure: "#/athleisure",
};

const FEATURE_LABEL: Record<string, string> = {
  compresion: "Compresión anatómica",
  ripstop: "Micro-Ripstop anti-desgarro",
  dwr: "Repelente al agua (DWR)",
  antiabrasion: "Paneles anti-abrasión",
  squatproof: "Opacidad Squat-Proof 360°",
  dryfit: "Tejido transpirable DryFit",
  cintura_alta: "Cintura alta que no se baja",
  reflectante: "Detalles reflectantes",
  french_terry: "French Terry cepillado",
  oversize: "Corte relajado / Oversize",
  bolsillos_zip: "Bolsillos con cremallera",
  antipilling: "Tratamiento anti-pilling",
};

const AUDIENCE_LABEL = { hombre: "Hombre", mujer: "Mujer", unisex: "Unisex" } as const;

const SORT_LABEL: Record<ReviewSort, string> = {
  recientes: "Más recientes",
  mejores: "Mejor valoradas",
  peores: "Peor valoradas",
};

const FREE_SHIPPING_FROM = 50;

export function ProductPage({
  productId,
  user,
  token,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenCart,
  onOpenLogin,
}: ProductPageProps) {
  const [data, setData] = useState<ProductPageData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const [reviews, setReviews] = useState<ProductReviews | null>(null);
  const [sort, setSort] = useState<ReviewSort>("recientes");
  const [reviewPage, setReviewPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);
  const reviewsRef = useRef<HTMLElement>(null);
  const userSizes = useUserSizes();
  // La talla elegida a mano no se pisa con la talla habitual.
  const sizeChosenByHand = useRef(false);

  // Producto: al cambiar de ficha se empieza de cero.
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setNotFound(false);
    setLoadError(false);
    setQuantity(1);
    setAdded(false);
    setSort("recientes");
    setReviewPage(1);
    setWriting(false);
    sizeChosenByHand.current = false;
    recordView(productId);

    void getProductPage(productId, token ?? undefined, controller.signal)
      .then((page) => {
        setData(page);
        setColor(page.colors[0]?.value ?? page.product.colors[0]?.value ?? "");
        const preferred = page.sizes.find((item) => item.size === page.product.defaultSize);
        const firstInStock = page.sizes.find((item) => item.stock > 0);
        setSize(
          (preferred && preferred.stock > 0 ? preferred : firstInStock)?.size ??
            page.product.defaultSize,
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiRequestError && error.status === 404) setNotFound(true);
        else setLoadError(true);
      });
    return () => controller.abort();
  }, [productId, token]);

  // Opiniones: se recargan al cambiar el orden o la página.
  useEffect(() => {
    let active = true;
    void getProductReviews(productId, { sort, page: reviewPage, token: token ?? undefined })
      .then((result) => {
        if (active) setReviews(result);
      })
      .catch(() => {
        if (active) setReviews(null);
      });
    return () => {
      active = false;
    };
  }, [productId, sort, reviewPage, token]);

  // Talla habitual del usuario (si está en stock). Se aplica también cuando
  // la sesión termina de restaurarse después de cargar la ficha.
  useEffect(() => {
    if (!data || sizeChosenByHand.current) return;
    const mine = preferredSizeFor(data.product, userSizes);
    const option = data.sizes.find((item) => item.size === mine && item.stock > 0);
    if (option) setSize(option.size);
  }, [data, userSizes?.top, userSizes?.bottom, userSizes?.shoe]);

  if (notFound || loadError) {
    return (
      <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
        <div className="mx-auto max-w-[880px] px-4 py-20 text-center">
          <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-slate-600">
            {notFound ? "search_off" : "cloud_off"}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
            {notFound ? "No encontramos esta prenda" : "No se pudo cargar la prenda"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {notFound
              ? "Puede que ya no esté en el catálogo."
              : "Comprueba que la tienda está en marcha e inténtalo de nuevo."}
          </p>
          <a
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-[#F04A10]"
            href="#/catalogo"
          >
            Ver el catálogo
          </a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:px-8">
          <div className="aspect-[4/5] animate-pulse rounded-3xl bg-white dark:bg-slate-800/60" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-white dark:bg-slate-800/60" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-white dark:bg-slate-800/60" />
            <div className="h-40 animate-pulse rounded-2xl bg-white dark:bg-slate-800/60" />
          </div>
        </div>
      </div>
    );
  }

  const { product, colors, sizes, related } = data;
  const favorited = favoriteIds.includes(product.id);
  const selectedColor = colors.find((item) => item.value === color);
  const selectedSize = sizes.find((item) => item.size === size);
  const stock = selectedSize?.stock ?? 0;
  const maxQuantity = Math.max(1, Math.min(10, stock));
  const savings =
    product.originalPrice !== undefined
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;
  const categoryHref = CATEGORY_PAGE[product.categorySlug ?? ""] ?? "#/catalogo";
  const reviewCount = reviews?.count ?? 0;

  const handleZoom = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    });
  };

  const handleAdd = async () => {
    if (stock === 0) return;
    const accepted = await onAddToCart({ productId: product.id, size, color, quantity });
    if (accepted === false) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  const goToReviews = () =>
    reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleSaveReview = async (draft: ReviewDraft) => {
    if (!token) return;
    setSavingReview(true);
    setReviewErrors([]);
    try {
      await saveReview(token, { productId: product.id, ...draft });
      setWriting(false);
      setSort("recientes");
      setReviewPage(1);
      setReviews(await getProductReviews(product.id, { token }));
      // La nota pública del producto ha cambiado.
      setData(await getProductPage(product.id, token));
    } catch (error) {
      setReviewErrors([
        error instanceof ApiRequestError ? error.message : "No se pudo guardar la reseña.",
      ]);
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 md:px-8 md:pb-24">
        {/* Migas */}
        <nav
          aria-label="Migas de pan"
          className="text-xs text-slate-500 dark:text-slate-400"
          data-reveal
        >
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <a className="transition-colors hover:text-primary" href="#">
                Inicio
              </a>
            </li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li>
              <a className="transition-colors hover:text-primary" href={categoryHref}>
                {product.category}
              </a>
            </li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li className="truncate font-semibold text-slate-700 dark:text-slate-200">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Producto */}
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-12">
          {/* Foto con zoom al pasar el ratón */}
          <div className="lg:sticky lg:top-28" data-reveal="left">
            <div
              className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              onMouseLeave={() => setZoom(null)}
              onMouseMove={handleZoom}
            >
              {product.badge.label && (
                <span className={product.badge.className}>{product.badge.label}</span>
              )}
              <div
                aria-label={product.name}
                className="h-full w-full bg-cover bg-center transition-transform duration-200 ease-out"
                role="img"
                style={{
                  backgroundImage: `url('${product.image}')`,
                  transform: zoom ? "scale(1.7)" : "scale(1)",
                  transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center",
                }}
              />
            </div>
            <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <span className="material-symbols-outlined text-[14px]">zoom_in</span>
              Pasa el ratón por la foto para ver el detalle del tejido
            </p>
          </div>

          {/* Información y compra */}
          <div data-reveal="right">
            {product.subtitle && (
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {product.subtitle}
              </p>
            )}
            <h1 className="mt-1.5 font-headline text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl lg:text-[34px] lg:leading-tight">
              {product.name}
            </h1>

            <button
              className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary dark:text-slate-300"
              onClick={goToReviews}
              type="button"
            >
              <Stars size={18} value={product.rating} />
              <span className="font-bold text-slate-900 dark:text-white">
                {product.rating.toLocaleString("es-ES", { minimumFractionDigits: 1 })}
              </span>
              <span className="underline-offset-2 hover:underline">
                {reviewCount} {reviewCount === 1 ? "opinión" : "opiniones"}
              </span>
            </button>

            {/* Precio */}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice !== undefined && (
                <>
                  <span className="pb-1 text-base tabular-nums text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <span className="mb-1 rounded-full bg-primary px-2 py-0.5 text-xs font-extrabold text-white">
                    −{savings}%
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              IVA incluido · Socios del Club:{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(Math.round(product.price * 90) / 100)} con CLUB10
              </span>
            </p>

            {product.description && (
              <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {product.description}
              </p>
            )}

            {/* Color */}
            {colors.length > 0 && (
              <fieldset className="mt-6">
                <legend className="text-sm font-bold text-slate-900 dark:text-white">
                  Color:{" "}
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {selectedColor?.name}
                  </span>
                </legend>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {colors.map((option) => (
                    <button
                      aria-label={option.name}
                      aria-pressed={option.value === color}
                      className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${
                        option.value === color
                          ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-900"
                          : ""
                      } ${option.hasBorder ? "border border-slate-300" : ""}`}
                      key={option.value}
                      onClick={() => setColor(option.value)}
                      style={{ backgroundColor: option.value }}
                      title={option.name}
                      type="button"
                    />
                  ))}
                </div>
              </fieldset>
            )}

            {/* Talla */}
            <fieldset className="mt-6">
              <legend className="flex w-full items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>
                  Talla:{" "}
                  <span className="font-medium text-slate-600 dark:text-slate-300">{size}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {AUDIENCE_LABEL[product.audience ?? "unisex"]}
                </span>
              </legend>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {sizes.map((option) => {
                  const soldOut = option.stock === 0;
                  const active = option.size === size;
                  return (
                    <button
                      aria-pressed={active}
                      className={`relative h-11 min-w-[52px] rounded-xl border px-3 text-sm font-bold transition-colors ${
                        soldOut
                          ? "cursor-not-allowed border-dashed border-slate-200 text-slate-300 line-through dark:border-slate-700 dark:text-slate-600"
                          : active
                            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-400"
                      }`}
                      disabled={soldOut}
                      key={option.size}
                      onClick={() => {
                        sizeChosenByHand.current = true;
                        setSize(option.size);
                        setQuantity(1);
                      }}
                      title={soldOut ? "Agotada" : `${option.stock} disponibles`}
                      type="button"
                    >
                      {option.size}
                    </button>
                  );
                })}
              </div>
              <p
                className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
                  stock === 0
                    ? "text-red-600 dark:text-red-400"
                    : stock <= 5
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {stock === 0 ? "block" : stock <= 5 ? "hourglass_bottom" : "check_circle"}
                </span>
                {stock === 0
                  ? "Talla agotada"
                  : stock <= 5
                    ? `¡Solo quedan ${stock} en esta talla!`
                    : "En stock · envío en 24/48h"}
              </p>
            </fieldset>

            {/* Cantidad, cesta y favorito */}
            <div className="mt-6 flex flex-wrap items-stretch gap-3">
              <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
                <button
                  aria-label="Quitar una unidad"
                  className="flex h-full w-10 items-center justify-center text-slate-600 hover:text-primary disabled:opacity-30 dark:text-slate-300"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">remove</span>
                </button>
                <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  aria-label="Añadir una unidad"
                  className="flex h-full w-10 items-center justify-center text-slate-600 hover:text-primary disabled:opacity-30 dark:text-slate-300"
                  disabled={quantity >= maxQuantity}
                  onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>

              <button
                className={`flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  added
                    ? "add-bounce bg-emerald-600 shadow-emerald-600/25"
                    : "bg-primary shadow-primary/25 hover:bg-[#F04A10]"
                }`}
                disabled={stock === 0}
                onClick={() => void handleAdd()}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {added ? "check" : "shopping_bag"}
                </span>
                {added
                  ? "¡Añadido a la cesta!"
                  : `Añadir a la cesta · ${formatPrice(product.price * quantity)}`}
              </button>

              <button
                aria-label={favorited ? "Quitar de favoritos" : "Añadir a favoritos"}
                aria-pressed={favorited}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                  favorited
                    ? "border-primary bg-orange-50 text-primary dark:bg-primary/15"
                    : "border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
                onClick={() => onToggleFavorite(product.id)}
                title={favorited ? "Quitar de favoritos" : "Guardar en favoritos"}
                type="button"
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={favorited ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  favorite
                </span>
              </button>
            </div>
            {added && (
              <button
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary dark:text-blue-400"
                onClick={onOpenCart}
                type="button"
              >
                Ver la cesta y tramitar
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}

            {/* Ventajas */}
            <ul className="mt-6 grid gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  local_shipping
                </span>
                Envío gratis desde {FREE_SHIPPING_FROM} €
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  assignment_return
                </span>
                Devolución gratis en 30 días
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">lock</span>
                Pago seguro con Stripe
              </li>
            </ul>

            {/* Propiedades y detalles */}
            <details
              className="group mt-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/90"
              open
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                Características técnicas
                <span className="material-symbols-outlined text-[20px] text-slate-400 transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-700">
                {product.features && product.features.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {product.features.map((feature) => (
                      <li
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                        key={feature}
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          verified
                        </span>
                        {FEATURE_LABEL[feature] ?? feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tejido técnico transpirable con costuras planas.
                  </p>
                )}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <dt className="text-slate-500 dark:text-slate-400">Disciplina</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-100">
                    {product.category}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Colección</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-100">
                    {AUDIENCE_LABEL[product.audience ?? "unisex"]}
                  </dd>
                  <dt className="text-slate-500 dark:text-slate-400">Referencia</dt>
                  <dd className="font-mono font-semibold uppercase text-slate-800 dark:text-slate-100">
                    {product.id}
                  </dd>
                </dl>
              </div>
            </details>
          </div>
        </div>

        {/* Opiniones */}
        <section className="mt-16 scroll-mt-28" id="opiniones" ref={reviewsRef} data-reveal>
          <h2 className="font-headline text-2xl font-extrabold text-slate-900 dark:text-white">
            Opiniones de clientes
          </h2>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            {/* Resumen */}
            <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/90 lg:sticky lg:top-28">
              <div className="flex items-end gap-3">
                <span className="font-headline text-5xl font-black tabular-nums text-slate-900 dark:text-white">
                  {(reviews?.count ? reviews.average : product.rating).toLocaleString("es-ES", {
                    minimumFractionDigits: 1,
                  })}
                </span>
                <div className="pb-1.5">
                  <Stars size={20} value={reviews?.count ? reviews.average : product.rating} />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {reviewCount} {reviewCount === 1 ? "opinión" : "opiniones"}
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((stars) => {
                  const total = reviews?.distribution[String(stars) as "1"] ?? 0;
                  const percent = reviewCount ? Math.round((total / reviewCount) * 100) : 0;
                  return (
                    <li className="flex items-center gap-2 text-xs" key={stars}>
                      <span className="w-14 shrink-0 text-slate-600 dark:text-slate-300">
                        {stars} {stars === 1 ? "estrella" : "estrellas"}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <span
                          className="block h-full rounded-full bg-amber-400"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="w-8 shrink-0 text-right tabular-nums text-slate-500 dark:text-slate-400">
                        {percent}%
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Escribir opinión */}
              <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-700">
                {!user ? (
                  <>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      ¿Tienes esta prenda? Cuéntanos qué te parece.
                    </p>
                    <button
                      className="mt-3 h-10 w-full rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary dark:border-slate-600 dark:text-slate-200"
                      onClick={onOpenLogin}
                      type="button"
                    >
                      Inicia sesión para opinar
                    </button>
                  </>
                ) : reviews?.canReview ? (
                  !writing && (
                    <button
                      className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-primary dark:bg-primary dark:hover:bg-[#E04B16]"
                      onClick={() => {
                        setWriting(true);
                        setReviewErrors([]);
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {reviews.myReview ? "edit" : "rate_review"}
                      </span>
                      {reviews.myReview ? "Editar mi opinión" : "Escribir una opinión"}
                    </button>
                  )
                ) : (
                  <p className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Solo pueden opinar los clientes que han comprado esta prenda.
                  </p>
                )}
              </div>
            </aside>

            {/* Lista */}
            <div>
              {writing && reviews?.canReview && (
                <div className="mb-5 rounded-2xl border border-primary/40 bg-white p-5 shadow-sm dark:bg-slate-800/90">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {reviews.myReview ? "Edita tu opinión" : "Tu opinión sobre esta prenda"}
                  </p>
                  <ReviewEditor
                    errors={reviewErrors}
                    initial={{
                      rating: reviews.myReview?.rating ?? 0,
                      title: reviews.myReview?.title ?? "",
                      comment: reviews.myReview?.comment ?? "",
                    }}
                    onCancel={() => setWriting(false)}
                    onSave={(draft) => void handleSaveReview(draft)}
                    saving={savingReview}
                  />
                </div>
              )}

              {reviewCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/60">
                  <span className="material-symbols-outlined text-[40px] text-slate-300 dark:text-slate-600">
                    reviews
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Todavía no hay opiniones de esta prenda.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Mostrando {reviews?.reviews.length} de {reviewCount}
                    </p>
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                      Ordenar por
                      <select
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                        onChange={(event) => {
                          setSort(event.target.value as ReviewSort);
                          setReviewPage(1);
                        }}
                        value={sort}
                      >
                        {(Object.keys(SORT_LABEL) as ReviewSort[]).map((option) => (
                          <option key={option} value={option}>
                            {SORT_LABEL[option]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <ul className="mt-4 space-y-3">
                    {reviews?.reviews.map((review, index) => (
                      <li
                        className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-800/90 ${
                          review.mine
                            ? "border-primary/50"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                        key={`${review.author}-${review.createdAt}-${index}`}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                            {review.author
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {review.author}
                              {review.mine && (
                                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-primary dark:bg-primary/15">
                                  Tu opinión
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(review.createdAt).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <Stars size={16} value={review.rating} />
                        </div>
                        {review.title && (
                          <p className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">
                            {review.title}
                          </p>
                        )}
                        {review.comment && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {review.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {reviews && reviews.pages > 1 && (
                    <nav
                      aria-label="Páginas de opiniones"
                      className="mt-5 flex items-center justify-center gap-1.5"
                    >
                      <button
                        aria-label="Opiniones anteriores"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        disabled={reviews.page <= 1}
                        onClick={() => setReviewPage((current) => current - 1)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        Página {reviews.page} de {reviews.pages}
                      </span>
                      <button
                        aria-label="Más opiniones"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        disabled={reviews.page >= reviews.pages}
                        onClick={() => setReviewPage((current) => current + 1)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-16" data-reveal>
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-headline text-2xl font-extrabold text-slate-900 dark:text-white">
                También te puede gustar
              </h2>
              <a
                className="inline-flex items-center gap-1 text-sm font-bold text-secondary hover:text-primary dark:text-blue-400"
                href={categoryHref}
              >
                Ver más de {product.category}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
            <div
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
              data-reveal-stagger
            >
              {related.map((item) => (
                <CatalogProductCard
                  favorited={favoriteIds.includes(item.id)}
                  key={item.id}
                  onAddToCart={onAddToCart}
                  onToggleFavorite={onToggleFavorite}
                  preferredColors={[]}
                  preferredSize={null}
                  product={item}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
