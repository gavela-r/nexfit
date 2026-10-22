// data/products.ts
// Catálogo NEXFIT en memoria. Es la misma fuente que usa el frontend
// (frontend/src/data/products.ts) para que la demo sea coherente.
// En una versión con base de datos este módulo pasaría a ser un repositorio.
import type { Product } from "../types/product";

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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAnq9_Fkduxvq_30nwHvEkyWgrORIQ4Y8KYi-cIdUzsVPUET1tlGxVg2r8zmgrY30onCs8Y2_RaaYn3HXQ89oiDrEHefELpgoEa7ppaqSRg4r8vvAKTCPDk8GHygvho1Id6l7ehrsYMufJxyr6Yo8v-mlFeTIaYnlu-W8IUfuLFxFE48O19_NxSLSRy7wZZhg6R65kwE3NEpp6ZvgTg8LxxWt7mkqix4rOVNFukeXYuV_b_WpXkhEK0",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKuJ0B32R7RB0fBQTUU1bBX2P2c33AcFUMksZBUg7KJT35k6eBs7zcxOQ9p1NOpLkO7aTZ8KA1i8zmCdrb2xXlRM4dwPRyieHj8_YwN-dhg1W_zaK3cx_fgVkZpGx4773-bKVDgFlh2eJAY5B7BuGG3CreQrS0ZZ5MEUIPdpLnArbM1OZ6Lli9Lo26oFAAHVRmUH3HcjyLvJ9xXKkzdNkcBfaaNS5oxDnu6q2DqJi5pABNKW43pl37",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnf39niKQ7sidC-hC3Dzpoq6Y4nOirLll3gE-JVDp_-ilCGTF0JQ1EPaPtMKO3VVgM6aLdXvK2svUDaKbB1rjutkpNcNh6W8jEyNaT5z_GYLSXHPhhmFTiDS59_yA0g9hVNJkwwDYxfa42XK2irtMFRrUdeIUDD5hIO4_wlED_yjadynZD-woOGfsfn-jeIX-NIpTlZEqALDj8pkISwHOCWt0kDekgXBGbWOaLzVJ5lySe9YtYVz2z",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6f4FSChPL4WpWbwjI2OhHm9pQeImKk9B9Za7dazCfxb-xgdEPOdhO_I-oyNkVeDci4YwB9I3umxAjs6966uQOl50DU-_LxMZFORG4AF2EKevwRCdE5Tayczam0eHa4Pt6kO34QgYjmue0-WLWwey2Vy4pDhIe_ZL9c911HAQDxrOqo7DC4aG1RoqkGLybtLGy4oUyrRvMiWmGZLYWStWWW6tyFO_oUe-6uKN2urw4yULfaGu_X4o9",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUSGNsUB9nMKa3hgpcwnrCrUK4MxAY5jg9nC6aID7qeDYAh0DIkG9IEPDXJAotjxt03WBLf-ESKzNsapZsnB_D8t7jMyIFD9EAf0vLmaF1gLeFuo80rhHRuVoFMZNYA1GXB5aN7NHhdYx5Pa9o4si4o7zFphRTo3syH8w5UeXFWFBxH2pG4CQaneujNH1tb5dgxYnInP4dkbXBJ9CR-pW0d9gjhZHA869m_v5sKuqlxpKg990HeXxo",
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
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7sicitLRWd5OI-jXZMZd_ZflhlhYblkiLVfehndVLLXVJSzVWYLZf5GsLJIGLN-ktDBlc8RclqVz7_1WjWAiLQ_4ym7GsAig3D7CpPG7izy4pTSaQb8SmmOvF5NKhxNCo5egth0UzI8LMvPEQwATBIRNWd4vXzZ6gN2Yn9reT_sQTpmM5GAaTPR4kb_Pz04vmmAcQsMze5K4BYHaTkGmDOkTR_1otD56XKwz2cwbUMXm8lRkJN-bU",
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

export function findProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
