// RecentlyViewedPage
// Vistos recientemente (#/cuenta/vistos): las últimas prendas con las que se
// ha interactuado, en el mismo orden (utils/recentlyViewed), con alta directa
// en la cesta y favoritos. Se puede vaciar el historial.
import { useEffect, useMemo, useState } from "react";
import { getProducts, type AuthUser, type CartItemInput } from "../api";
import type { Product } from "../data/products";
import {
  clearRecentlyViewed,
  onRecentlyViewedChange,
  readRecentlyViewed,
} from "../utils/recentlyViewed";
import { AccountLayout } from "./AccountLayout";
import { CatalogProductCard } from "./CatalogProductCard";

interface RecentlyViewedPageProps {
  user: AuthUser | null;
  restoring: boolean;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (item: CartItemInput) => Promise<boolean> | void;
  onOpenLogin: () => void;
}

export function RecentlyViewedPage({
  user,
  restoring,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenLogin,
}: RecentlyViewedPageProps) {
  const [catalog, setCatalog] = useState<Product[] | null>(null);
  const [ids, setIds] = useState(readRecentlyViewed);

  useEffect(() => {
    const controller = new AbortController();
    void getProducts(controller.signal)
      .then(setCatalog)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // Tocar una tarjeta aquí también la registra; para que no salte al primer
  // puesto mientras se usa, la lista solo se relee al vaciarla (o desde otra pestaña).
  useEffect(
    () =>
      onRecentlyViewedChange(() => {
        if (readRecentlyViewed().length === 0) setIds([]);
      }),
    [],
  );

  const products = useMemo(() => {
    if (!catalog) return [];
    const byId = new Map(catalog.map((product) => [product.id, product]));
    return ids.map((id) => byId.get(id)).filter((product): product is Product => !!product);
  }, [catalog, ids]);

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="vistos"
      subtitle="Las últimas prendas que has mirado en la tienda, para volver a ellas en un clic."
      title="Vistos recientemente"
      user={user}
    >
      {!catalog ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              className="h-[420px] animate-pulse rounded-2xl bg-white dark:bg-slate-800/60"
              key={index}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <section
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/60"
          data-reveal="zoom"
        >
          <span className="material-symbols-outlined text-[44px] text-slate-300 dark:text-slate-600">
            history
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
            Aún no has mirado ninguna prenda
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Las prendas que toques en el catálogo (talla, color, favorito) o elijas en el buscador
            aparecerán aquí.
          </p>
          <a
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-[#F04A10]"
            href="#/catalogo"
          >
            Explorar el catálogo
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800/90">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-extrabold text-slate-900 dark:text-white">
                {products.length} {products.length === 1 ? "prenda" : "prendas"}
              </span>{" "}
              · solo se guardan en este navegador
            </p>
            <button
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              onClick={clearRecentlyViewed}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Borrar historial
            </button>
          </div>

          <div
            className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
            data-reveal-stagger
          >
            {products.map((product) => (
              <CatalogProductCard
                favorited={favoriteIds.includes(product.id)}
                key={product.id}
                onAddToCart={onAddToCart}
                onToggleFavorite={onToggleFavorite}
                preferredColors={[]}
                preferredSize={null}
                product={product}
              />
            ))}
          </div>
        </>
      )}
    </AccountLayout>
  );
}
