// SearchOverlay
// Buscador global en panel superpuesto. Se abre desde la lupa de la cabecera
// con el atajo ⌘K / Ctrl+K, consulta el backend y, al elegir un resultado,
// filtra el catálogo con ese término.
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { searchProducts } from "../api";
import type { Product } from "../data/products";
import { formatPrice } from "../utils/format";

const DEBOUNCE_MS = 250;
const SUGGESTIONS = ["Running", "Compresión", "Training", "Sudadera"];

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Término con el que se filtra el catálogo al elegir un resultado. */
  onSelectQuery: (query: string) => void;
}

type Status = "idle" | "loading" | "ready";

export function SearchOverlay({ open, onClose, onSelectQuery }: SearchOverlayProps) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  // Bloquea el desplazamiento de la página mientras el panel está abierto.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Foco inicial y cierre con la tecla Escape.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Búsqueda con debounce; cancela la petición anterior para no pintar resultados viejos.
  useEffect(() => {
    if (!open) return;

    const query = term.trim();
    if (!query) {
      setResults([]);
      setStatus("idle");
      setHighlight(0);
      return;
    }

    setStatus("loading");
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchProducts(query, controller.signal)
        .then((items) => {
          if (requestId !== requestIdRef.current) return;
          setResults(items);
          setHighlight(0);
          setStatus("ready");
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setResults([]);
          setStatus("ready");
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, open]);

  // El panel sólo se pinta en el portal (document.body) cuando está abierto.
  if (!open) return null;

  const choose = (product: Product) => {
    onSelectQuery(product.name);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setHighlight((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setHighlight((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      const product = results[highlight];
      if (product) {
        event.preventDefault();
        choose(product);
      }
    }
  };

  return createPortal(
    <div
      aria-label="Buscador NEXFIT"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
    >
      {/* Fondo: al pulsarlo se cierra el panel */}
      <button
        aria-label="Cerrar buscador"
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        {/* Campo de búsqueda */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
          <span className="material-symbols-outlined text-[22px] text-slate-400">search</span>
          <input
            aria-label="Buscar productos"
            className="h-14 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar ropa deportiva, zapatillas, accesorios..."
            ref={inputRef}
            type="search"
            value={term}
          />
          {term.length > 0 && (
            <button
              aria-label="Limpiar búsqueda"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:text-primary"
              onClick={() => setTerm("")}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
            ESC
          </kbd>
        </div>

        {/* Cuerpo del panel */}
        <div className="max-h-[52vh] overflow-y-auto p-2 custom-scrollbar">
          {status === "idle" && (
            <div className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Búsquedas populares
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                    key={suggestion}
                    onClick={() => setTerm(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                Usa <span className="font-semibold">↑ ↓</span> para navegar,{" "}
                <span className="font-semibold">Intro</span> para abrir el producto y{" "}
                <span className="font-semibold">Esc</span> para cerrar.
              </p>
            </div>
          )}

          {status === "loading" && (
            <p className="flex items-center gap-2 p-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Buscando «{term}»…
            </p>
          )}

          {status === "ready" && results.length > 0 && (
            <ul className="space-y-1">
              {results.map((product, index) => (
                <li key={product.id}>
                  <button
                    className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${
                      index === highlight
                        ? "bg-orange-50 dark:bg-slate-700/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    }`}
                    onClick={() => choose(product)}
                    onMouseEnter={() => setHighlight(index)}
                    type="button"
                  >
                    <span
                      className="h-14 w-12 shrink-0 rounded-lg border border-slate-200 bg-cover bg-center dark:border-slate-700"
                      style={{ backgroundImage: `url('${product.image}')` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                        {product.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {product.category}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-black tabular text-slate-900 dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status === "ready" && results.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No encontramos nada para «{term}». Prueba con «Running» o «Compresión».
            </p>
          )}
        </div>

        {/* Pie con el número de resultados */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[11px] text-slate-400 dark:border-slate-700">
          <span>
            {status === "ready"
              ? `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`
              : "Catálogo NEXFIT"}
          </span>
          <span className="hidden sm:inline">
            Al elegir un producto se filtra el catálogo de la página
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
