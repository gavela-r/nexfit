// CatalogProductCard
// Tarjeta de las páginas de catálogo (Hombre y Mujer): subtítulo técnico, descripción,
// tallas disponibles, precio con ahorro y alta directa en el carrito.
import { useState } from "react";
import type { CartItemInput } from "../api";
import type { Product } from "../data/products";
import { formatPrice } from "../utils/format";

const SIZE_IDLE =
  "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-900 dark:hover:border-slate-400";
const SIZE_ACTIVE =
  "border border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900";

interface CatalogProductCardProps {
  product: Product;
  onAddToCart: (item: CartItemInput) => void;
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
  const initialSize =
    preferredSize && product.sizes.includes(preferredSize) ? preferredSize : product.defaultSize;
  const [size, setSize] = useState(initialSize);
  const [added, setAdded] = useState(false);

  const savings =
    product.originalPrice !== undefined
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const handleAdd = () => {
    const color =
      product.colors.find((option) => preferredColors.includes(option.value.toUpperCase())) ??
      product.colors[0];
    onAddToCart({ productId: product.id, size, color: color?.value ?? "", quantity: 1 });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-black/50 transition-all duration-300">
      {/* Imagen */}
      <div className="relative aspect-[4/3.6] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <span className={product.badge.className}>{product.badge.label}</span>
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
        <div
          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundImage: `url('${product.image}')` }}
          role="img"
          aria-label={product.name}
        />
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
            {product.name}
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
                aria-label={`Talla ${option}`}
                aria-pressed={option === size}
                onClick={() => setSize(option)}
                className={`min-w-8 h-8 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  option === size ? SIZE_ACTIVE : SIZE_IDLE
                }`}
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
            onClick={handleAdd}
            className={`h-10 px-4 rounded-xl text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
              added ? "bg-emerald-600" : "bg-primary hover:bg-[#E04B16]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {added ? "check" : "add_shopping_cart"}
            </span>
            <span>{added ? "¡Añadido!" : "Añadir"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
