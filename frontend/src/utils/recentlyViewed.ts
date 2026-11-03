// recentlyViewed.ts
// «Vistos recientemente»: ids de las últimas prendas con las que se ha
// interactuado (tarjeta o buscador), guardados en este navegador.
// La tienda no tiene ficha de producto, así que «ver» una prenda es tocar su
// tarjeta (talla, color, favorito, añadir) o elegirla en el buscador.
// Un evento propio avisa a la página abierta cuando la lista cambia.

const STORAGE_KEY = "nexfit_recently_viewed";
const CHANGE_EVENT = "nexfit:recently-viewed";
const MAX_ITEMS = 12;

/** Lista guardada, de la más reciente a la más antigua. */
export function readRecentlyViewed(): string[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Almacenamiento bloqueado (modo privado...): la lista simplemente no se guarda.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Pone la prenda la primera de la lista (sin repetirla). */
export function recordView(productId: string): void {
  const current = readRecentlyViewed();
  if (current[0] === productId) return;
  write([productId, ...current.filter((id) => id !== productId)].slice(0, MAX_ITEMS));
}

export function clearRecentlyViewed(): void {
  write([]);
}

/** Avisa cuando la lista cambia (en esta pestaña o en otra). Devuelve la baja. */
export function onRecentlyViewedChange(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
