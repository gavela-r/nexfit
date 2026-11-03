// useHashRoute.ts
// Enrutado mínimo por hash, sin dependencias: «#/hombre» y «#/mujer» abren el
// catálogo de cada colección; «#/futbol», «#/fitness», «#/crossfit»,
// «#/running», «#/outdoor» y «#/athleisure», los de cada deporte; «#/catalogo»,
// el catálogo completo, y cualquier otro hash («#catalogo»...) es un ancla de
// la portada.
// Así los enlaces existentes siguen funcionando igual.
import { useEffect, useState } from "react";

export type Page =
  | "home"
  | "hombre"
  | "mujer"
  | "futbol"
  | "fitness"
  | "crossfit"
  | "outdoor"
  | "running"
  | "athleisure"
  | "catalogo"
  | "pedido-confirmado"
  | "pedido-cancelado"
  | "favoritos"
  | "cuenta-perfil"
  | "cuenta-pedidos"
  | "cuenta-devoluciones"
  | "cuenta-resenas"
  | "cuenta-vistos"
  | "cuenta-club"
  | "producto";

const ROUTES: Record<string, Page> = {
  "#/hombre": "hombre",
  "#/mujer": "mujer",
  "#/futbol": "futbol",
  "#/fitness": "fitness",
  "#/crossfit": "crossfit",
  "#/outdoor": "outdoor",
  "#/running": "running",
  "#/athleisure": "athleisure",
  "#/catalogo": "catalogo",
  // Vuelta desde Stripe Checkout (pago completado o cancelado).
  "#/pedido/confirmado": "pedido-confirmado",
  "#/pedido/cancelado": "pedido-cancelado",
  // Área de cliente (requieren sesión).
  "#/favoritos": "favoritos",
  "#/cuenta/perfil": "cuenta-perfil",
  "#/cuenta/pedidos": "cuenta-pedidos",
  "#/cuenta/devoluciones": "cuenta-devoluciones",
  "#/cuenta/resenas": "cuenta-resenas",
  "#/cuenta/vistos": "cuenta-vistos",
  "#/cuenta/club": "cuenta-club",
};

/** Ficha de producto: «#/producto/nex-07». */
const PRODUCT_ROUTE = /^#\/producto\/([A-Za-z0-9-]+)$/;

function readRoute(): { page: Page; anchor: string; productId: string } {
  const hash = window.location.hash;
  const product = PRODUCT_ROUTE.exec(hash);
  if (product) return { page: "producto", anchor: "", productId: product[1] };

  const page = ROUTES[hash] ?? "home";
  // En la portada, el hash (sin «#») es el id de la sección a la que ir.
  const anchor = page === "home" ? decodeURIComponent(hash.replace(/^#\/?/, "")) : "";
  return { page, anchor, productId: "" };
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}
