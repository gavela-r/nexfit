// CatalogSection
// Rejilla de productos con filtros de categoría y carga desde el backend.
import { useEffect, useMemo, useState } from "react";
import { getProducts, type CartItemInput } from "../api";
import { products as localProducts, type Product } from "../data/products";
import { matchesQuery } from "../utils/search";
import { ProductCard } from "./ProductCard";

const FILTERS = ["Más Vendidos", "Novedades", "Entrenamiento", "Running"] as const;
type Filter = (typeof FILTERS)[number];

const CHIP_ACTIVE =
  "h-9 px-4 rounded-xl bg-slate-900 dark:bg-primary text-white text-xs font-bold shadow-sm cursor-pointer";
const CHIP_IDLE =
  "h-9 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary text-xs font-medium transition-colors cursor-pointer";

function applyFilter(items: Product[], filter: Filter): Product[] {
  switch (filter) {
    case "Novedades":
      return items.filter(
        (item) => item.badge.label === "Nuevo" || item.badge.label === "Tendencia",
      );
    case "Entrenamiento":
      return items.filter((item) => /training|fitness|crossfit/i.test(item.category));
    case "Running":
      return items.filter((item) => /running|outdoor/i.test(item.category));
    case "Más Vendidos":
    default:
      return [...items].sort((a, b) => b.rating - a.rating);
  }
}

interface CatalogSectionProps {
  onAddToCart: (item: CartItemInput) => void;
  /** IDs de los productos favoritos del usuario. */
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  /** Término de búsqueda compartido con el buscador de la cabecera. */
  query: string;
  onQueryChange: (query: string) => void;
}

export function CatalogSection({
  onAddToCart,
  favoriteIds,
  onToggleFavorite,
  query,
  onQueryChange,
}: CatalogSectionProps) {
  const [items, setItems] = useState<Product[]>(localProducts);
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [source, setSource] = useState<"local" | "api">("local");

  useEffect(() => {
    let active = true;
    void getProducts().then((data) => {
      if (!active) return;
      setItems(data);
      setSource(data === localProducts ? "local" : "api");
    });
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    const byFilter = applyFilter(items, filter);
    if (!query.trim()) return byFilter;
    return byFilter.filter(
      (item) => matchesQuery(item.name, query) || matchesQuery(item.category, query),
    );
  }, [items, filter, query]);

  const resetCatalog = () => {
    setFilter(FILTERS[0]);
    onQueryChange("");
  };

  return (
    <>
      {/* 4. CATÁLOGO DE PRODUCTOS EN FORMA DE CARTAS (CARDS) CON SELECTORES Y BOTÓN DIRECTO */}
      <section
        className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16"
        id="catalogo"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Demostración de Catálogo
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-headline-lg">
              Productos Destacados
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {source === "api" ? "Sincronizado con la API NEXFIT" : "Catálogo local de respaldo"}
              {" · "}
              {visible.length} de {items.length} productos
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Buscador contextual: filtra la rejilla de forma inmediata */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                <span className="material-symbols-outlined text-[18px]" data-icon="search">
                  search
                </span>
              </span>
              <input
                aria-label="Filtrar productos del catálogo"
                className="w-full h-10 pl-10 pr-9 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Filtrar por nombre o categoría..."
                type="search"
                value={query}
              />
              {query.length > 0 && (
                <button
                  aria-label="Limpiar filtro"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-primary"
                  onClick={() => onQueryChange("")}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[17px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === filter}
                  onClick={() => setFilter(option)}
                  className={option === filter ? CHIP_ACTIVE : CHIP_IDLE}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                favorited={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {query.trim()
                ? `No encontramos productos que coincidan con «${query.trim()}».`
                : "No hay productos en este filtro todavía."}
            </p>
            <button
              type="button"
              onClick={resetCatalog}
              className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Ver todos
            </button>
          </div>
        )}
      </section>
    </>
  );
}
