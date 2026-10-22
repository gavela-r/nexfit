// utils/search.ts
// Normalización para búsquedas y filtros del frontend: minúsculas y sin
// tildes, de modo que "pantalon" encuentre "Pantalón" y "running" "RUNNING".

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
