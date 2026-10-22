// data/categories.ts
// Las 6 disciplinas deportivas del catálogo NEXFIT.
import type { Category } from "../types/product";

export const categories: Category[] = [
  { slug: "fitness", label: "Fitness / Gimnasio", items: 142 },
  { slug: "running", label: "Running", items: 89 },
  { slug: "athleisure", label: "Athleisure / Casual", items: 115 },
  { slug: "futbol", label: "Fútbol", items: 64 },
  { slug: "crossfit", label: "CrossFit / Entrenamiento", items: 78 },
  { slug: "outdoor", label: "Outdoor", items: 93 },
];
