// FavoritesPage
// Prendas guardadas con el corazón (#/favoritos). Los ids llegan de la tabla
// `favorites` (App los mantiene) y los datos de cada prenda del catálogo.
// Al quitar un favorito, la tarjeta desaparece de la rejilla al momento.
import { useEffect, useMemo, useState } from "react";
import { getProducts, type AuthUser, type CartItemInput } from "../api";
import type { Product } from "../data/products";
import { AccountLayout } from "./AccountLayout";
import { CatalogProductCard } from "./CatalogProductCard";

interface FavoritesPageProps {
  user: AuthUser | null;
  restoring: boolean;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (item: CartItemInput) => Promise<boolean> | void;
  onOpenLogin: () => void;
}

export function FavoritesPage({
  user,
  restoring,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
  onOpenLogin,
}: FavoritesPageProps) {
  const [catalog, setCatalog] = useState<Product[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getProducts(controller.signal)
      .then(setCatalog)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  // El backend ya los devuelve del más reciente al más antiguo.
  const favorites = useMemo(() => {
    if (!catalog) return [];
    const byId = new Map(catalog.map((product) => [product.id, product]));
    return favoriteIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => product !== undefined);
  }, [catalog, favoriteIds]);

  const total = favorites.reduce((sum, product) => sum + product.price, 0);

  return (
    <AccountLayout
      onOpenLogin={onOpenLogin}
      restoring={restoring}
      section="favoritos"
      subtitle="Las prendas que has guardado con el corazón, listas para cuando quieras."
      title="Mis favoritos"
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
      ) : favorites.length === 0 ? (
        <section
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800/60"
          data-reveal="zoom"
        >
          <span className="material-symbols-outlined text-[44px] text-slate-300 dark:text-slate-600">
            heart_plus
          </span>
          <h2 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-white">
            Todavía no tienes favoritos
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-600 dark:text-slate-300">
            Pulsa el corazón de cualquier prenda para guardarla aquí y encontrarla después.
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
                {favorites.length}{" "}
                {favorites.length === 1 ? "prenda guardada" : "prendas guardadas"}
              </span>{" "}
              · valor total{" "}
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
              </span>
            </p>
            <a
              className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:text-primary dark:text-blue-400"
              href="#/catalogo"
            >
              Seguir explorando
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>

          <div
            className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
            data-reveal-stagger
          >
            {favorites.map((product) => (
              <CatalogProductCard
                favorited
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
