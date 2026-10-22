// products.ts
// Catálogo NEXFIT. En producción lo sirve el backend (GET /api/products);
// esta copia local hace de respaldo si la API no está disponible.

export interface ProductColor {
  value: string;
  /** Clases extra (p. ej. borde para el color blanco). */
  className?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  rating: number;
  badge: { label: string; className: string };
  image: string;
  favorited: boolean;
  sizes: string[];
  defaultSize: string;
  colors: ProductColor[];
  price: number;
  originalPrice?: number;
}

export const products: Product[] = [
  {
    id: "nex-01",
    name: "Camiseta Técnica Transpirable NEX-Pro",
    category: "Training / Fitness",
    rating: 4.9,
    badge: {
      label: "Nuevo",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-secondary text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-01.jpg",
    favorited: false,
    sizes: ["S", "M", "L", "XL"],
    defaultSize: "M",
    colors: [
      {
        value: "#111827",
      },
      {
        value: "#FF5A1F",
      },
      {
        value: "#2563EB",
      },
    ],
    price: 34.95,
  },
  {
    id: "nex-02",
    name: "Mallas de Compresión HyperMotion Mujer",
    category: "Mujer / Running & Fitness",
    rating: 5,
    badge: {
      label: "Oferta -20%",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-primary text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-02.jpg",
    favorited: true,
    sizes: ["XS", "S", "M", "L"],
    defaultSize: "XS",
    colors: [
      {
        value: "#004B71",
      },
      {
        value: "#111827",
      },
      {
        value: "#9E1B32",
      },
    ],
    price: 49.95,
    originalPrice: 62,
  },
  {
    id: "nex-03",
    name: "Chaqueta Cortavientos StormRun",
    category: "Running / Outdoor",
    rating: 4.8,
    badge: {
      label: "Técnico",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-slate-900 dark:bg-slate-700 text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-03.jpg",
    favorited: false,
    sizes: ["S", "M", "L", "XL"],
    defaultSize: "L",
    colors: [
      {
        value: "#2563EB",
      },
      {
        value: "#111827",
      },
    ],
    price: 69.9,
  },
  {
    id: "nex-04",
    name: "Sudadera Athleisure Oversize Fleece",
    category: "Athleisure / Moda Deportiva",
    rating: 4.7,
    badge: {
      label: "Tendencia",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-04.jpg",
    favorited: false,
    sizes: ["S", "M", "L", "XL"],
    defaultSize: "M",
    colors: [
      {
        value: "#E5E0D8",
      },
      {
        value: "#111827",
      },
      {
        value: "#64748B",
      },
    ],
    price: 55,
  },
  {
    id: "nex-05",
    name: "Pantalón Corto 2 en 1 TrainReady",
    category: "Training / CrossFit",
    rating: 4.9,
    badge: {
      label: "Best Seller",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-slate-900 dark:bg-slate-700 text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-05.jpg",
    favorited: false,
    sizes: ["S", "M", "L", "XL"],
    defaultSize: "L",
    colors: [
      {
        value: "#111827",
      },
      {
        value: "#374151",
      },
      {
        value: "#1E3A8A",
      },
    ],
    price: 32.5,
  },
  {
    id: "nex-06",
    name: "Top Deportivo Impact Control",
    category: "Mujer / Running & Fitness",
    rating: 4.9,
    badge: {
      label: "Soporte Alto",
      className:
        "absolute top-3.5 left-3.5 z-10 bg-primary text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full shadow-sm",
    },
    image: "/assets/images/product-nex-06.jpg",
    favorited: false,
    sizes: ["XS", "S", "M", "L"],
    defaultSize: "S",
    colors: [
      {
        value: "#AE3200",
      },
      {
        value: "#111827",
      },
      {
        value: "#FFFFFF",
        className: "border border-slate-300",
      },
    ],
    price: 28.95,
  },
];
