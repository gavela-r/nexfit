// ProductCard
// Tarjeta de producto con selectores de talla y color, favorito y alta en carrito.
import { useState } from "react";
import type { Product } from "../data/products";
import type { CartItemInput } from "../api";
import { formatPrice } from "../utils/format";

const SIZE_IDLE =
  "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:border-primary";
const SIZE_ACTIVE =
  "border-2 border-primary bg-orange-50 dark:bg-primary/20 text-primary font-bold";
const SWATCH_ACTIVE = "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-800";
const ADD_BUTTON =
  "h-10 px-4 rounded-xl text-white font-bold text-xs inline-flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer";

interface ProductCardProps {
  product: Product;
  onAddToCart: (item: CartItemInput) => void;
  /** Si el producto está en favoritos (tabla `favorites`). */
  favorited: boolean;
  onToggleFavorite: (productId: string) => void;
}

export function ProductCard({
  product,
  onAddToCart,
  favorited,
  onToggleFavorite,
}: ProductCardProps) {
  const [size, setSize] = useState(product.defaultSize);
  const [colorIndex, setColorIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const color = product.colors[colorIndex];
    onAddToCart({
      productId: product.id,
      size,
      color: color?.value ?? "",
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/50 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Box */}
        <div className="relative aspect-[4/5] bg-slate-100 dark:bg-slate-900 overflow-hidden">
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

        {/* Card Content */}
        <div className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{product.category}</span>
              <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                <span
                  className="material-symbols-outlined text-amber-500 text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="tabular">{product.rating.toFixed(1)}</span>
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>

          {/* Size Selector Pills */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Talla:
            </span>
            <div className="flex items-center gap-1.5 size-selector">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={`Talla ${option}`}
                  aria-pressed={option === size}
                  onClick={() => setSize(option)}
                  className={`w-8 h-8 rounded-lg text-xs cursor-pointer ${
                    option === size ? SIZE_ACTIVE : SIZE_IDLE
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Color:
            </span>
            <div className="flex items-center gap-1.5">
              {product.colors.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  aria-label={`Color ${option.value}`}
                  aria-pressed={index === colorIndex}
                  onClick={() => setColorIndex(index)}
                  className={`w-4 h-4 rounded-full cursor-pointer ${
                    index === colorIndex ? SWATCH_ACTIVE : ""
                  } ${option.className ?? ""}`}
                  style={{ backgroundColor: option.value }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Direct Add Button */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
        <div>
          {product.originalPrice !== undefined && (
            <span className="text-xs text-slate-400 line-through block tabular">
              {formatPrice(product.originalPrice)}
            </span>
          )}
          <span
            className={`text-xl font-black font-headline-sm tabular ${
              product.originalPrice !== undefined
                ? "text-primary"
                : "text-slate-900 dark:text-white"
            }`}
          >
            {formatPrice(product.price)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className={`${ADD_BUTTON} ${
            added
              ? "bg-emerald-600"
              : "bg-slate-900 hover:bg-primary dark:bg-primary dark:hover:bg-[#E04B16]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {added ? "check" : "add_shopping_cart"}
          </span>
          <span>{added ? "¡Añadido!" : "Añadir"}</span>
        </button>
      </div>
    </article>
  );
}
