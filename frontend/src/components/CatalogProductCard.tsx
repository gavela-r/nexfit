// CatalogProductCard
// Tarjeta de las páginas de catálogo (Hombre y Mujer): subtítulo técnico, descripción,
// tallas disponibles, precio con ahorro y alta directa en el carrito.
import { useEffect, useRef, useState } from "react";
import type { CartItemInput } from "../api";
import type { Product } from "../data/products";
import { formatPrice } from "../utils/format";
import { recordView } from "../utils/recentlyViewed";
import { pickAvailableSize, preferredSizeFor, soldOutSizes, useUserSizes } from "../utils/sizes";

const SIZE_IDLE =
  "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-900 dark:hover:border-slate-400";
const SIZE_ACTIVE =
  "border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900";

interface CatalogProductCardProps {
  product: Product;
  onAddToCart: (item: CartItemInput) => Promise<boolean> | void;
  favorited: boolean;
  onToggleFavorite: (productId: string) => void;
  /** Talla elegida en los filtros: se preselecciona si el producto la tiene. */
  preferredSize: string | null;
  /** Color elegido en los filtros: es el que se añade a la cesta. */
  preferredColors: string[];
}

export function CatalogProductCard({
  product,
  onAddToCart,
  favorited,
  onToggleFavorite,
  preferredSize,
  preferredColors,
}: CatalogProductCardProps) {
  // Prioridad: talla del filtro del catálogo > talla habitual del usuario > la de la prenda.
  // Prioridad: talla del filtro > talla habitual del usuario > la de la prenda,
  // saltando siempre las tallas agotadas.
  const soldOut = soldOutSizes(product);
  const allSoldOut = product.sizes.every((option) => soldOut.has(option));
  const initialSize = pickAvailableSize(product, [
    preferredSize,
    preferredSizeFor(product, useUserSizes()),
    product.defaultSize,
  ]);
  const [size, setSize] = useState(initialSize);
  // Si el usuario entra (o cambia sus tallas) con la tarjeta ya pintada, se
  // actualiza mientras no haya elegido otra talla a mano.
  const chosenByHand = useRef(false);
  useEffect(() => {
    if (!chosenByHand.current) setSize(initialSize);
  }, [initialSize]);
  const [added, setAdded] = useState(false);

  const savings =
    product.originalPrice !== undefined
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAdd = async () => {
    const color =
      product.colors.find((option) => preferredColors.includes(option.value.toUpperCase())) ??
      product.colors[0];
    // Solo se marca «¡Añadido!» si la cesta lo ha aceptado (puede faltar stock).
    const accepted = await onAddToCart({
      productId: product.id,
      size,
      color: color?.value ?? "",
      quantity: 1,
    });
    if (accepted === false) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    // Cualquier clic en la tarjeta (talla, color, favorito, añadir) cuenta como «visto».
    <article
      onClickCapture={() => recordView(product.id)}
      className="card-lift group flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300"
    >
      {/* Imagen */}
      <div className="relative aspect-[4/3.6] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {/* Sin distintivo en la BD (badge_label NULL) no se pinta la etiqueta vacía */}
        {product.badge.label && (
          <span className={product.badge.className}>{product.badge.label}</span>
        )}
        <button
          type="button"
          aria-label={favorited ? "Quitar de favoritos" : "Añadir a favoritos"}
          aria-pressed={favorited}
          onClick={() => onToggleFavorite(product.id)}
          className={`absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white flex items-center justify-center shadow-sm transition-transform active:scale-90 cursor-pointer ${
            favorited ? "text-primary" : "text-slate-700 dark:text-slate-200 hover:text-primary"
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px]"
            style={favorited ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            favorite
          </span>
        </button>
        {/* La foto y el nombre llevan a la ficha del producto */}
        <a
          aria-label={`Ver ${product.name}`}
          className="block h-full w-full"
          href={`#/producto/${product.id}`}
        >
          <div
            className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
            style={{ backgroundImage: `url('${product.image}')` }}
            role="img"
            aria-label={product.name}
          />
        </a>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {product.subtitle ?? product.category}
          </p>
          <h3
            className="mt-1 font-bold text-[15px] text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors"
            title={product.name}
          >
            <a href={`#/producto/${product.id}`}>{product.name}</a>
          </h3>
          {product.description && (
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        <div>
          <span className="block mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Talla disponible:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {product.sizes.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={soldOut.has(option) ? `Talla ${option} (agotada)` : `Talla ${option}`}
                aria-pressed={option === size}
                disabled={soldOut.has(option)}
                title={soldOut.has(option) ? "Agotada" : undefined}
                onClick={() => {
                  chosenByHand.current = true;
                  setSize(option);
                }}
                className={`min-w-8 h-8 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  option === size ? SIZE_ACTIVE : SIZE_IDLE
                } ${soldOut.has(option) ? "line-through opacity-40 cursor-not-allowed" : ""}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Precio y alta en la cesta */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-headline-sm tabular text-slate-900 dark:text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice !== undefined && (
                <span className="text-xs text-slate-400 line-through tabular">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {savings !== null ? (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ahorro {savings}%
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">IVA incl.</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={allSoldOut || soldOut.has(size)}
            className={`h-10 px-4 rounded-xl text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-400 disabled:active:scale-100 dark:disabled:bg-slate-600 ${
              added ? "add-bounce bg-emerald-600" : "bg-primary hover:bg-[#E04B16]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {allSoldOut ? "block" : added ? "check" : "add_shopping_cart"}
            </span>
            <span>{allSoldOut ? "Agotado" : added ? "¡Añadido!" : "Añadir"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
