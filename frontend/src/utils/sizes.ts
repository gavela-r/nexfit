// sizes.ts
// Talla habitual del usuario: se guarda en el perfil y se preselecciona sola
// en tarjetas y ficha según el tipo de prenda.
//   · Arriba → camisetas, tops, sudaderas, chaquetas, vestidos (y prendas sin tipo)
//   · Abajo  → pantalones, shorts, mallas de compresión
//   · Calzado → accesorios con tallas numéricas (botas, zapatillas)
import { createContext, useContext } from "react";
import type { UserSizes } from "../api";
import type { Product } from "../data/products";

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

const BOTTOM_TYPES = new Set(["pantalon", "short", "compresion"]);

/** Tallas del usuario de la sesión (null sin sesión). App la provee. */
export const UserSizesContext = createContext<UserSizes | null>(null);

export function useUserSizes(): UserSizes | null {
  return useContext(UserSizesContext);
}

/** Talla guardada que corresponde a esta prenda, si la prenda la tiene. */
export function preferredSizeFor(product: Product, sizes: UserSizes | null): string | null {
  if (!sizes) return null;

  let wanted: string | null;
  if (product.garmentType === "accesorio") {
    // Solo el calzado tiene tallas numéricas; el resto de accesorios es talla única.
    wanted = product.sizes.some((size) => /^\d+$/.test(size)) ? sizes.shoe : null;
  } else if (product.garmentType && BOTTOM_TYPES.has(product.garmentType)) {
    wanted = sizes.bottom;
  } else {
    wanted = sizes.top;
  }

  return wanted && product.sizes.includes(wanted) ? wanted : null;
}

/** Tallas agotadas del producto (las manda el backend; el catálogo local no las tiene). */
export function soldOutSizes(product: Product): Set<string> {
  return new Set(product.soldOutSizes ?? []);
}

/**
 * Primera talla con stock de la lista de preferencias (filtro del catálogo,
 * talla habitual, talla por defecto...). Si ninguna vale, la primera que
 * quede; si no queda ninguna, la talla por defecto (la prenda está agotada).
 */
export function pickAvailableSize(
  product: Product,
  preferences: (string | null | undefined)[],
): string {
  const soldOut = soldOutSizes(product);
  const usable = (size: string | null | undefined): size is string =>
    !!size && product.sizes.includes(size) && !soldOut.has(size);
  return (
    preferences.find(usable) ??
    product.sizes.find((size) => !soldOut.has(size)) ??
    product.defaultSize
  );
}
