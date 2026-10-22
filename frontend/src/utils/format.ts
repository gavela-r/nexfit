// format.ts
// Formato de precios con cifras tabulares en español (DESIGN.md).

const EURO = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return EURO.format(value);
}
