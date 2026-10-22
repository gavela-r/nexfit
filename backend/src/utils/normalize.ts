// utils/normalize.ts
// Normalización compartida por el buscador y los filtros: minúsculas y sin
// tildes, para que "pantalon" encuentre "Pantalón" y "CARRERA" "carrera".

/** Convierte a minúsculas y elimina los diacríticos. */
export function foldAccents(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Coincidencia flexible: `field` contiene `query`. */
export function matchesQuery(field: string, query: string): boolean {
  const needle = foldAccents(query);
  if (needle.length === 0) return true;
  return foldAccents(field).includes(needle);
}
