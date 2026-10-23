// CollectionCatalogPage
// Página de catálogo (#/hombre, #/mujer y #/catalogo con todo): cabecera, chips de
// disciplina, filtros técnicos, ordenación, rejilla paginada y bloque de ayuda.
// Textos y opciones de filtro llegan en `config` (data/catalogs.ts).
// Los productos llegan de GET /api/products[?audience=…] (con respaldo local);
// el filtrado se hace en el navegador porque la colección es pequeña.
import { useEffect, useMemo, useRef, useState } from "react";
import { getProducts, getProductsByAudience, type CartItemInput } from "../api";
import type { CatalogConfig } from "../data/catalogs";
import { products as localProducts, type Product } from "../data/products";
import { CatalogProductCard } from "./CatalogProductCard";

const PAGE_SIZE = 6;
const PRICE_MIN = 30;
const PRICE_MAX = 150;

const SORTS = [
  { id: "rating", label: "Destacados Rendimiento" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "discount", label: "Mayor descuento" },
] as const;

type SortId = (typeof SORTS)[number]["id"];

const CHIP_ACTIVE =
  "h-10 px-4 rounded-xl bg-slate-900 dark:bg-primary text-white text-xs font-bold shadow-sm cursor-pointer whitespace-nowrap";
const CHIP_IDLE =
  "h-10 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary text-xs font-medium transition-colors cursor-pointer whitespace-nowrap";
const CHECKBOX =
  "w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-[#FF5A1F] cursor-pointer";
const FILTER_TITLE =
  "float-left w-full text-[13px] font-bold text-slate-900 dark:text-white mb-2.5";

function disciplineOf(config: CatalogConfig, product: Product): string | undefined {
  const slug = product.categorySlug ?? "";
  return config.disciplines.find((item) => item.slugs.includes(slug))?.id;
}

/** ¿El producto entra en alguno de los tipos de prenda marcados? */
function matchesGarment(config: CatalogConfig, selected: string[], product: Product): boolean {
  const type = product.garmentType;
  if (!type) return false;
  return selected.some((id) => {
    const option = config.garments.find((item) => item.id === id);
    return (option?.types ?? [id]).includes(type);
  });
}

/** Limita la lista a las categorías de la página (p. ej. solo fútbol). */
function inScope(config: CatalogConfig, products: Product[]): Product[] {
  const { categories } = config;
  if (!categories) return products;
  return products.filter((product) => categories.includes(product.categorySlug ?? ""));
}

function discountOf(product: Product): number {
  return product.originalPrice ? 1 - product.price / product.originalPrice : 0;
}

/** Alterna un valor dentro de una lista (casillas de verificación). */
function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

interface CollectionCatalogPageProps {
  config: CatalogConfig;
  onAddToCart: (item: CartItemInput) => void;
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
}

export function CollectionCatalogPage({
  config,
  onAddToCart,
  favoriteIds,
  onToggleFavorite,
}: CollectionCatalogPageProps) {
  const { audience } = config;
  const [items, setItems] = useState<Product[]>(() =>
    inScope(
      config,
      audience ? localProducts.filter((product) => product.audience === audience) : localProducts,
    ),
  );
  // Colección, disciplina y tipo de prenda: sin casillas marcadas no se filtra (se ve todo).
  const [audiences, setAudiences] = useState<string[]>([]);
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [garments, setGarments] = useState<string[]>([]);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState<SortId>("rating");
  const [page, setPage] = useState(1);
  // En móvil y tablet los filtros se despliegan con un botón.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const request = audience
      ? getProductsByAudience(audience, controller.signal)
      : getProducts(controller.signal);
    void request
      .then((data) => {
        if (!controller.signal.aborted) setItems(inScope(config, data));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [audience, config]);

  const visible = useMemo(() => {
    const filtered = items.filter((product) => {
      if (audiences.length > 0 && !audiences.includes(product.audience ?? "unisex")) {
        return false;
      }
      const discipline = disciplineOf(config, product);
      if (disciplines.length > 0 && !(discipline && disciplines.includes(discipline))) {
        return false;
      }
      if (garments.length > 0 && !matchesGarment(config, garments, product)) {
        return false;
      }
      if (size && !product.sizes.includes(size)) return false;
      if (color && !product.colors.some((option) => option.value.toUpperCase() === color)) {
        return false;
      }
      if (!features.every((feature) => product.features?.includes(feature))) return false;
      // Con el control al máximo no hay tope: entran también los de más de PRICE_MAX.
      return maxPrice >= PRICE_MAX || product.price <= maxPrice;
    });

    return filtered.sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "discount":
          return discountOf(b) - discountOf(a) || b.rating - a.rating;
        default:
          return b.rating - a.rating || a.name.localeCompare(b.name);
      }
    });
  }, [config, items, audiences, disciplines, garments, size, color, features, maxPrice, sort]);

  // Cualquier cambio de filtros u orden vuelve a la primera página.
  useEffect(() => {
    setPage(1);
  }, [audiences, disciplines, garments, size, color, features, maxPrice, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = visible.slice(firstIndex, firstIndex + PAGE_SIZE);

  const activeFilters =
    (audiences.length > 0 ? 1 : 0) +
    (disciplines.length > 0 ? 1 : 0) +
    (garments.length > 0 ? 1 : 0) +
    (size ? 1 : 0) +
    (color ? 1 : 0) +
    features.length +
    (maxPrice < PRICE_MAX ? 1 : 0);

  const resetFilters = () => {
    setAudiences([]);
    setDisciplines([]);
    setGarments([]);
    setSize(null);
    setColor(null);
    setFeatures([]);
    setMaxPrice(PRICE_MAX);
  };

  const goToPage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Chips superiores: por disciplina o, en páginas de un solo deporte, por prenda.
  const chipsByGarment = config.chips === "garments";
  const chipOptions = chipsByGarment
    ? config.garments.filter((item) => item.chip).map((item) => ({ id: item.id, chip: item.chip }))
    : config.disciplines;
  const chipSelection = chipsByGarment ? garments : disciplines;
  const setChipSelection = chipsByGarment ? setGarments : setDisciplines;

  // Chip activo: «Todos» sin nada marcado, o el único marcado.
  const activeChip =
    chipSelection.length === 0 ? "all" : chipSelection.length === 1 ? chipSelection[0] : null;

  return (
    <div className="w-full bg-[#F5F7FB] dark:bg-[#0B1220]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-14 md:pb-20">
        {/* Migas de pan */}
        <nav aria-label="Migas de pan" className="text-xs text-slate-500 dark:text-slate-400">
          <ol className="flex items-center gap-1.5">
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Inicio
              </a>
            </li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href={config.crumbHref ?? `#/${config.slug}`}
              >
                {config.crumb}
              </a>
            </li>
            <li aria-hidden="true" className="material-symbols-outlined text-[14px]">
              chevron_right
            </li>
            <li aria-current="page" className="font-semibold text-slate-800 dark:text-slate-200">
              {config.crumbCurrent ?? "Catálogo Ropa Deportiva"}
            </li>
          </ol>
        </nav>

        {/* Cabecera de la colección */}
        <header className="mt-5 flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 dark:bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {config.eyebrow}
            </span>
            <h1 className="mt-3 text-[28px] leading-9 sm:text-[32px] sm:leading-10 font-extrabold font-headline-lg text-slate-900 dark:text-white">
              {config.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{config.intro}</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-2.5 self-start md:self-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">
              {config.icon ?? "checkroom"}
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular">
              {items.length} artículos {config.scope}
            </span>
          </div>
        </header>

        {/* Chips de disciplina (o de prenda) */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          <button
            type="button"
            aria-pressed={activeChip === "all"}
            onClick={() => setChipSelection([])}
            className={activeChip === "all" ? CHIP_ACTIVE : CHIP_IDLE}
          >
            {config.allChip ?? "Todos los deportes"}
          </button>
          {chipOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={activeChip === item.id}
              onClick={() => setChipSelection([item.id])}
              className={activeChip === item.id ? CHIP_ACTIVE : CHIP_IDLE}
            >
              {item.chip}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 lg:gap-8 items-start">
          {/* Botón de filtros (móvil y tablet) */}
          <button
            type="button"
            aria-controls={`filtros-${config.slug}`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((current) => !current)}
            className="lg:hidden h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-slate-100 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
            {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            {activeFilters > 0 && (
              <span className="bg-primary text-white text-[11px] font-extrabold px-1.5 py-0.5 rounded-full">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Filtros técnicos */}
          <aside
            id={`filtros-${config.slug}`}
            aria-label="Filtros técnicos"
            className={`${
              filtersOpen ? "block" : "hidden"
            } lg:block lg:sticky lg:top-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="flex items-center gap-2 text-base font-bold font-headline-sm text-slate-900 dark:text-white">
                <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
                Filtros Técnicos
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                disabled={activeFilters === 0}
                className="text-xs font-bold text-primary hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-default"
              >
                Limpiar
              </button>
            </div>

            {config.audiences && (
              <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
                <legend className={FILTER_TITLE}>Colección</legend>
                <div className="clear-left space-y-2">
                  {config.audiences.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className={CHECKBOX}
                        checked={audiences.includes(item.id)}
                        onChange={() => setAudiences((current) => toggle(current, item.id))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {config.disciplines.length > 0 && (
              <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
                <legend className={FILTER_TITLE}>Disciplina deportiva</legend>
                <div className="clear-left space-y-2">
                  {config.disciplines.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className={CHECKBOX}
                        checked={disciplines.includes(item.id)}
                        onChange={() => setDisciplines((current) => toggle(current, item.id))}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
              <legend className={FILTER_TITLE}>Tipo de prenda</legend>
              <div className="clear-left space-y-2">
                {config.garments.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      checked={garments.includes(item.id)}
                      onChange={() => setGarments((current) => toggle(current, item.id))}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
              <legend className={FILTER_TITLE}>{config.sizeLegend}</legend>
              <div
                className={`clear-left grid ${config.sizes.length > 5 ? "grid-cols-6" : "grid-cols-5"} gap-1.5`}
              >
                {config.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={size === option}
                    onClick={() => setSize((current) => (current === option ? null : option))}
                    className={`h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      size === option
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white"
                        : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-900 dark:hover:border-slate-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
              <legend className={FILTER_TITLE}>Color</legend>
              <div className="clear-left flex flex-wrap gap-2.5">
                {config.colors.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.label}
                    aria-label={`Color ${option.label}`}
                    aria-pressed={color === option.value}
                    onClick={() =>
                      setColor((current) => (current === option.value ? null : option.value))
                    }
                    className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 transition-shadow cursor-pointer ${
                      color === option.value
                        ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-800"
                        : ""
                    }`}
                    style={{ backgroundColor: option.value }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="py-4 border-b border-slate-100 dark:border-slate-700">
              <legend className={FILTER_TITLE}>Ajuste & Propiedades</legend>
              <div className="clear-left space-y-2">
                {config.features.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      checked={features.includes(item.id)}
                      onChange={() => setFeatures((current) => toggle(current, item.id))}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="precio-maximo"
                  className="text-[13px] font-bold text-slate-900 dark:text-white"
                >
                  Precio Máximo
                </label>
                <span className="text-xs font-bold text-primary tabular">
                  {maxPrice >= PRICE_MAX ? `${PRICE_MAX}+` : maxPrice} €
                </span>
              </div>
              <input
                id="precio-maximo"
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={5}
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="w-full accent-[#FF5A1F] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 tabular">
                <span>{PRICE_MIN} €</span>
                <span>{PRICE_MAX}+ €</span>
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <section
            aria-label={`Productos ${config.scope}`}
            className="min-w-0 scroll-mt-28"
            ref={resultsRef}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-5 py-3.5 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
                Mostrando{" "}
                <strong className="text-slate-900 dark:text-white tabular">{visible.length}</strong>{" "}
                prendas técnicas {config.scope}
              </p>
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                Ordenar por:
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortId)}
                  className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {SORTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pageItems.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pageItems.map((product) => (
                  <CatalogProductCard
                    key={`${product.id}-${size ?? ""}`}
                    product={product}
                    favorited={favoriteIds.includes(product.id)}
                    onToggleFavorite={onToggleFavorite}
                    onAddToCart={onAddToCart}
                    preferredSize={size}
                    preferredColors={color ? [color] : []}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-10 text-center">
                <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600">
                  search_off
                </span>
                <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Ninguna prenda cumple todos los filtros.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Prueba a quitar alguna propiedad o a subir el precio máximo.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 h-10 px-5 rounded-xl bg-slate-900 dark:bg-primary text-white text-xs font-bold cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Paginación */}
            {visible.length > 0 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular">
                  Mostrando{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {firstIndex + 1} - {firstIndex + pageItems.length}
                  </strong>{" "}
                  de <strong className="text-slate-900 dark:text-white">{visible.length}</strong>{" "}
                  productos técnicos {config.scope}
                </p>
                {pageCount > 1 && (
                  <nav aria-label="Paginación" className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 hover:border-primary disabled:opacity-40 disabled:hover:border-slate-200 cursor-pointer disabled:cursor-default"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      Anterior
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                      <button
                        key={number}
                        type="button"
                        aria-current={number === currentPage ? "page" : undefined}
                        onClick={() => goToPage(number)}
                        className={`h-9 w-9 rounded-lg text-xs font-bold tabular cursor-pointer ${
                          number === currentPage
                            ? "bg-slate-900 dark:bg-primary text-white"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary"
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === pageCount}
                      onClick={() => goToPage(currentPage + 1)}
                      className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 hover:border-primary disabled:opacity-40 disabled:hover:border-slate-200 cursor-pointer disabled:cursor-default"
                    >
                      Siguiente
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </nav>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Ayuda: tallas, garantía y envíos */}
        <section className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 p-6 md:p-8 shadow-sm">
          <div className="flex gap-4">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-orange-50 dark:bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">straighten</span>
            </span>
            <div>
              <h3 className="font-bold font-headline-sm text-slate-900 dark:text-white">
                {config.help.sizeTitle}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {config.help.sizeText}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary">
                {config.help.sizeLink}
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-blue-50 dark:bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </span>
            <div>
              <h3 className="font-bold font-headline-sm text-slate-900 dark:text-white">
                {config.help.guaranteeTitle ?? "Garantía Pro-Athlete"}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {config.help.guaranteeText}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                {config.help.guaranteeNote ?? "30 días de prueba en entrenamiento"}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </span>
            <div>
              <h3 className="font-bold font-headline-sm text-slate-900 dark:text-white">
                {config.help.shippingTitle ?? "Envíos y Cambios Gratis"}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {config.help.shippingText}
              </p>
              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {config.help.shippingNote ?? "Envío gratuito en pedidos superiores a 50 €"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
