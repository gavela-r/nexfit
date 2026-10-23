// useHashRoute.ts
// Enrutado mínimo por hash, sin dependencias: «#/hombre» y «#/mujer» abren el
// catálogo de cada colección; «#/futbol», «#/running» y «#/athleisure», los de
// cada deporte; «#/catalogo», el catálogo completo, y cualquier otro hash
// («#catalogo», «#fitness»...) es un ancla de la portada. Así los enlaces
// existentes siguen funcionando igual.
import { useEffect, useState } from "react";

export type Page = "home" | "hombre" | "mujer" | "futbol" | "running" | "athleisure" | "catalogo";

const ROUTES: Record<string, Page> = {
  "#/hombre": "hombre",
  "#/mujer": "mujer",
  "#/futbol": "futbol",
  "#/running": "running",
  "#/athleisure": "athleisure",
  "#/catalogo": "catalogo",
};

function readRoute(): { page: Page; anchor: string } {
  const hash = window.location.hash;
  const page = ROUTES[hash] ?? "home";
  // En la portada, el hash (sin «#») es el id de la sección a la que ir.
  const anchor = page === "home" ? decodeURIComponent(hash.replace(/^#\/?/, "")) : "";
  return { page, anchor };
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
