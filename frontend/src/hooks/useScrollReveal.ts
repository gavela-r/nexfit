// useScrollReveal.ts
// Anima la aparición de secciones y rejillas al entrar en pantalla.
//   · [data-reveal]         → el propio elemento (variantes en index.css)
//   · [data-reveal-stagger] → sus hijos, uno detrás de otro (variable --i)
// Un MutationObserver recoge lo que se pinta después (cambio de página,
// productos que llegan del backend, filtros): los hijos nuevos de una rejilla
// ya visible reciben su propio orden y entran también escalonados, y un
// elemento reutilizado por React que pierde «is-revealed» se vuelve a vigilar.
// Además de IntersectionObserver hay una comprobación por posición al hacer
// scroll y al cargar: si el observador no llegara a avisar, nada se queda oculto.
// Con «reducir movimiento» o sin IntersectionObserver no se oculta nada.
import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-reveal-stagger]";

function setOrder(elements: Element[]) {
  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) element.style.setProperty("--i", String(index));
  });
}

export function useScrollReveal() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    root.classList.add("reveal-on");

    const pending = new Set<Element>();

    const reveal = (target: Element) => {
      if (!pending.delete(target)) return;
      if (target.hasAttribute("data-reveal-stagger")) setOrder(Array.from(target.children));
      target.classList.add("is-revealed");
      intersection.unobserve(target);
    };

    const intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) reveal(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const track = (element: Element) => {
      if (element.classList.contains("is-revealed") || pending.has(element)) return;
      pending.add(element);
      intersection.observe(element);
    };

    const watch = (scope: ParentNode) => {
      scope.querySelectorAll(SELECTOR).forEach(track);
    };

    // Red de seguridad: lo que ya está a la vista (o por encima) se muestra.
    const sweep = () => {
      const limit = window.innerHeight;
      if (limit === 0) return;
      for (const element of Array.from(pending)) {
        if (!element.isConnected) {
          pending.delete(element);
          continue;
        }
        if (element.getBoundingClientRect().top < limit) reveal(element);
      }
    };

    let sweepTimer = 0;
    const scheduleSweep = () => {
      if (sweepTimer) return;
      sweepTimer = window.setTimeout(() => {
        sweepTimer = 0;
        sweep();
      }, 120);
    };

    // Al imprimir no hay animaciones: todo visible.
    const revealAll = () => Array.from(pending).forEach(reveal);

    watch(document);
    scheduleSweep();

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        // React puede reutilizar el mismo nodo para otra cosa (p. ej. la rejilla
        // pasa a ser el aviso «sin resultados» y vuelve a ser rejilla): al
        // reescribir className se pierde «is-revealed» sin que se inserte ningún
        // nodo. Si un elemento animable queda sin revelar, se vuelve a vigilar.
        if (record.type === "attributes") {
          const target = record.target;
          if (target instanceof Element && target.matches(SELECTOR)) track(target);
          continue;
        }

        const added = Array.from(record.addedNodes).filter(
          (node): node is Element => node instanceof Element,
        );
        if (added.length === 0) continue;

        // Hijos nuevos en una rejilla ya visible: entran escalonados entre sí.
        const parent = record.target;
        if (parent instanceof Element && parent.matches("[data-reveal-stagger].is-revealed")) {
          setOrder(added);
        }

        for (const node of added) {
          if (node.matches(SELECTOR)) track(node);
          watch(node);
        }
      }
      scheduleSweep();
    });
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-reveal", "data-reveal-stagger"],
    });

    window.addEventListener("scroll", scheduleSweep, { passive: true });
    window.addEventListener("resize", scheduleSweep);
    window.addEventListener("beforeprint", revealAll);

    return () => {
      window.clearTimeout(sweepTimer);
      window.removeEventListener("scroll", scheduleSweep);
      window.removeEventListener("resize", scheduleSweep);
      window.removeEventListener("beforeprint", revealAll);
      mutations.disconnect();
      intersection.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);
}
