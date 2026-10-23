// catalogs.ts
// Configuración de las páginas de catálogo (#/hombre, #/mujer y #/catalogo): textos,
// disciplinas, tipos de prenda, tallas, colores y propiedades de cada filtro.
// La página es la misma (CollectionCatalogPage); solo cambia esta ficha.
import type { Audience } from "./products";

export interface CatalogOption {
  id: string;
  label: string;
}

/** Tipo de prenda del filtro: agrupa uno o varios garment_type de la BD. */
export interface CatalogGarment extends CatalogOption {
  /** garment_type que incluye; por defecto, solo el propio id. */
  types?: string[];
  /** Texto del chip superior cuando la página filtra por prenda. */
  chip?: string;
}

/** Disciplina: agrupa una o varias categorías (slug) de la base de datos. */
export interface CatalogDiscipline extends CatalogOption {
  chip: string;
  slugs: string[];
}

export interface CatalogConfig {
  /** Público del catálogo; sin él se muestran todos los productos. */
  audience?: Audience;
  /** Ruta de la página sin «#/» (hombre, mujer, catalogo). */
  slug: string;
  /** Miga de pan: Inicio › {crumb} › {crumbCurrent}. */
  crumb: string;
  /** Destino de la miga intermedia; por defecto la propia página. */
  crumbHref?: string;
  crumbCurrent?: string;
  /** Solo productos de estas categorías (slug); sin ella, todas. */
  categories?: string[];
  /** Qué agrupan los chips superiores; por defecto, disciplinas. */
  chips?: "disciplines" | "garments";
  /** Texto del primer chip («Todos los deportes»). */
  allChip?: string;
  /** Icono (Material Symbols) del contador de artículos. */
  icon?: string;
  /** Complemento de los recuentos: «artículos {scope}». */
  scope: string;
  sizeLegend: string;
  /** Filtro «Colección» (Hombre / Mujer / Unisex); solo en el catálogo completo. */
  audiences?: { id: Audience; label: string }[];
  eyebrow: string;
  title: string;
  intro: string;
  disciplines: CatalogDiscipline[];
  garments: CatalogGarment[];
  sizes: string[];
  /** Muestras del filtro de color (hex en mayúsculas, como en la BD). */
  colors: { value: string; label: string }[];
  features: CatalogOption[];
  help: {
    sizeTitle: string;
    sizeText: string;
    sizeLink: string;
    guaranteeTitle?: string;
    guaranteeText: string;
    /** Línea final de cada bloque; por defecto, la de la tienda. */
    guaranteeNote?: string;
    shippingTitle?: string;
    shippingText: string;
    shippingNote?: string;
  };
}

export const MEN_CATALOG: CatalogConfig = {
  audience: "hombre",
  slug: "hombre",
  crumb: "Hombre",
  scope: "de hombre",
  sizeLegend: "Talla (Hombre)",
  eyebrow: "Colección oficial masculina 2026",
  title: "Ropa Deportiva de Hombre · Alto Rendimiento y Confort",
  intro:
    "Prendas de compresión anatómica, tejidos micro-ripstop y transpirabilidad probada en atletas. Diseñadas para entrenar, competir y recuperar sin límites.",
  disciplines: [
    { id: "futbol", label: "Fútbol Match & Training", chip: "Fútbol", slugs: ["futbol"] },
    {
      id: "crossfit",
      label: "CrossFit / Fitness Gym",
      chip: "CrossFit / Gym",
      slugs: ["crossfit", "fitness"],
    },
    { id: "running", label: "Running & Velocidad", chip: "Running", slugs: ["running"] },
    {
      id: "outdoor",
      label: "Outdoor & Trail Trekking",
      chip: "Outdoor / Trail",
      slugs: ["outdoor"],
    },
    {
      id: "athleisure",
      label: "Athleisure & Recuperación",
      chip: "Athleisure",
      slugs: ["athleisure"],
    },
  ],
  garments: [
    { id: "camiseta", label: "Camisetas & Maillots" },
    { id: "pantalon", label: "Shorts & Pantalones", types: ["pantalon", "short"] },
    { id: "chaqueta", label: "Chaquetas & Sudaderas", types: ["chaqueta", "sudadera"] },
    { id: "compresion", label: "Ropa de Compresión" },
  ],
  sizes: ["S", "M", "L", "XL", "XXL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#374151", label: "Grafito" },
    { value: "#2563EB", label: "Azul" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#4B5D3A", label: "Verde oliva" },
  ],
  features: [
    { id: "compresion", label: "Compresión anatómica" },
    { id: "ripstop", label: "Micro-Ripstop anti-desgarro" },
    { id: "dwr", label: "Repelente al agua (DWR)" },
    { id: "antiabrasion", label: "Paneles anti-abrasión" },
  ],
  help: {
    sizeTitle: "Guía de Tallas para Hombre",
    sizeText:
      "Patronaje deportivo atlético ajustado al tórax y hombros. Si buscas compresión extrema, elige tu talla habitual; para un ajuste holgado, selecciona una talla superior.",
    sizeLink: "Tabla de medidas (cm) en cada ficha",
    guaranteeText:
      "Todas las prendas masculinas NEXFIT están testadas en sesiones de alta intensidad: rozamiento con barras olímpicas, tracción en carrera y resistencia al sudor.",
    shippingText:
      "Recibe tu equipación en 24/48 horas con entrega exprés garantizada. Cambios de talla sin coste alguno a domicilio o en punto de recogida.",
  },
};

export const WOMEN_CATALOG: CatalogConfig = {
  audience: "mujer",
  slug: "mujer",
  crumb: "Mujer",
  scope: "de mujer",
  sizeLegend: "Talla (Mujer)",
  eyebrow: "Colección oficial femenina 2026",
  title: "Ropa Deportiva de Mujer · Rendimiento, Flexibilidad y Confort",
  intro:
    "Prendas técnicas anatómicas para fitness, yoga, running, outdoor y training. Modeladas en 3D con relieve puro de producto.",
  disciplines: [
    { id: "fitness", label: "Fitness & Entrenamiento", chip: "Fitness / Gym", slugs: ["fitness"] },
    { id: "running", label: "Running & Velocidad", chip: "Running", slugs: ["running"] },
    { id: "yoga", label: "Yoga, Pilates & Barre", chip: "Yoga & Pilates", slugs: ["yoga"] },
    { id: "outdoor", label: "Outdoor & Trail", chip: "Outdoor / Trail", slugs: ["outdoor"] },
    { id: "crossfit", label: "CrossFit & Hiit", chip: "CrossFit", slugs: ["crossfit"] },
    { id: "futbol", label: "Fútbol Match & Training", chip: "Fútbol", slugs: ["futbol"] },
    {
      id: "athleisure",
      label: "Athleisure & Recuperación",
      chip: "Athleisure",
      slugs: ["athleisure"],
    },
  ],
  garments: [
    { id: "top", label: "Tops & Sujetadores Deportivos" },
    { id: "compresion", label: "Leggings & Mallas Sculpt" },
    { id: "chaqueta", label: "Chaquetas & Sudaderas", types: ["chaqueta", "sudadera"] },
    { id: "short", label: "Shorts Técnicos 2-en-1" },
    { id: "pantalon", label: "Pantalones & Joggers" },
    { id: "camiseta", label: "Camisetas & Pullovers" },
    { id: "vestido", label: "Vestidos" },
  ],
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#4B5D3A", label: "Verde oliva" },
    { value: "#2563EB", label: "Azul" },
    { value: "#AE3200", label: "Terracota" },
    { value: "#374151", label: "Grafito" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#E5E0D8", label: "Arena" },
    { value: "#C4999B", label: "Rosa palo" },
  ],
  features: [
    { id: "compresion", label: "Compresión media-alta" },
    { id: "squatproof", label: "Efecto segunda piel (Squat-proof)" },
    { id: "dryfit", label: "Tejido transpirable DryFit" },
    { id: "cintura_alta", label: "Cintura alta reforzada" },
  ],
  help: {
    sizeTitle: "Guía de Tallas para Mujer",
    sizeText:
      "Patronaje ergonómico adaptado a la morfología femenina: busto, contorno de cintura y cadera. Si buscas máxima compresión sculpt, elige tu talla habitual; para ajuste suave, una talla superior.",
    sizeLink: "Consultar tabla de medidas (cm)",
    guaranteeText:
      "Todas las prendas femeninas NEXFIT están probadas en entrenamientos de alto rendimiento: sentadillas intensivas squat-proof, fricción continua y retención de forma lavado tras lavado.",
    shippingText:
      "Recibe tu equipación en 24/48 horas con entrega exprés garantizada. Cambios de talla rápidos y sin coste alguno a domicilio o en punto de recogida.",
  },
};

/** Catálogo completo: todos los públicos y todas las categorías (#/catalogo). */
export const ALL_CATALOG: CatalogConfig = {
  slug: "catalogo",
  crumb: "Todos los productos",
  scope: "en el catálogo",
  sizeLegend: "Talla",
  eyebrow: "Catálogo completo NEXFIT 2026",
  title: "Toda la Ropa Deportiva · Hombre, Mujer y Unisex",
  intro:
    "Todas las prendas técnicas de la tienda en un solo lugar: fútbol, CrossFit, fitness, running, yoga, outdoor y athleisure. Filtra por colección, disciplina, talla o propiedades.",
  audiences: [
    { id: "hombre", label: "Hombre" },
    { id: "mujer", label: "Mujer" },
    { id: "unisex", label: "Unisex" },
  ],
  disciplines: [
    { id: "futbol", label: "Fútbol Match & Training", chip: "Fútbol", slugs: ["futbol"] },
    { id: "crossfit", label: "CrossFit & Hiit", chip: "CrossFit", slugs: ["crossfit"] },
    { id: "fitness", label: "Fitness & Gimnasio", chip: "Fitness / Gym", slugs: ["fitness"] },
    { id: "running", label: "Running & Velocidad", chip: "Running", slugs: ["running"] },
    { id: "yoga", label: "Yoga, Pilates & Barre", chip: "Yoga & Pilates", slugs: ["yoga"] },
    {
      id: "outdoor",
      label: "Outdoor & Trail Trekking",
      chip: "Outdoor / Trail",
      slugs: ["outdoor"],
    },
    {
      id: "athleisure",
      label: "Athleisure & Recuperación",
      chip: "Athleisure",
      slugs: ["athleisure"],
    },
  ],
  garments: [
    { id: "camiseta", label: "Camisetas & Pullovers" },
    { id: "top", label: "Tops & Sujetadores Deportivos" },
    { id: "pantalon", label: "Shorts & Pantalones", types: ["pantalon", "short"] },
    { id: "chaqueta", label: "Chaquetas & Sudaderas", types: ["chaqueta", "sudadera"] },
    { id: "compresion", label: "Compresión, Leggings & Mallas" },
    { id: "vestido", label: "Vestidos" },
    { id: "accesorio", label: "Calzado & Accesorios" },
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#374151", label: "Grafito" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#2563EB", label: "Azul" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#AE3200", label: "Terracota" },
    { value: "#4B5D3A", label: "Verde oliva" },
    { value: "#C4999B", label: "Rosa palo" },
    { value: "#E5E0D8", label: "Arena" },
    { value: "#FFFFFF", label: "Blanco" },
  ],
  features: [
    { id: "compresion", label: "Compresión anatómica" },
    { id: "ripstop", label: "Micro-Ripstop anti-desgarro" },
    { id: "dwr", label: "Repelente al agua (DWR)" },
    { id: "antiabrasion", label: "Paneles anti-abrasión" },
    { id: "squatproof", label: "Efecto segunda piel (Squat-proof)" },
    { id: "dryfit", label: "Tejido transpirable DryFit" },
    { id: "cintura_alta", label: "Cintura alta reforzada" },
    { id: "reflectante", label: "Detalles Reflectantes 360°" },
    { id: "french_terry", label: "Tejido French Terry cepillado" },
    { id: "oversize", label: "Corte relajado / Oversize" },
    { id: "bolsillos_zip", label: "Bolsillos termosellados con cremallera" },
    { id: "antipilling", label: "Tratamiento anti-pilling" },
  ],
  help: {
    sizeTitle: "Guía de Tallas NEXFIT",
    sizeText:
      "Cada colección tiene su propio patronaje: atlético en hombre y ergonómico en mujer. Si buscas compresión máxima, elige tu talla habitual; para un ajuste holgado, una talla superior.",
    sizeLink: "Tabla de medidas (cm) en cada ficha",
    guaranteeText:
      "Todas las prendas NEXFIT están probadas en entrenamientos de alta intensidad: rozamiento, sentadillas squat-proof, tracción en carrera y resistencia al sudor.",
    shippingText:
      "Recibe tu equipación en 24/48 horas con entrega exprés garantizada. Cambios de talla sin coste alguno a domicilio o en punto de recogida.",
  },
};

/** Ropa de fútbol de hombre y mujer (#/futbol): chips por tipo de prenda. */
export const FOOTBALL_CATALOG: CatalogConfig = {
  slug: "futbol",
  crumb: "Deportes",
  crumbHref: "#/catalogo",
  crumbCurrent: "Fútbol · Ropa de Fútbol",
  categories: ["futbol"],
  chips: "garments",
  allChip: "Todos (Hombre y Mujer)",
  icon: "sports_soccer",
  scope: "de fútbol",
  sizeLegend: "Talla (Hombre / Mujer)",
  eyebrow: "Colección oficial fútbol 2026",
  title: "Ropa de Fútbol · Alto Rendimiento para Hombre y Mujer",
  intro:
    "Equipaciones oficiales de partido, pantalones térmicos de entrenamiento y shorts técnicos con ajuste ergonómico 3D.",
  audiences: [
    { id: "hombre", label: "Hombre" },
    { id: "mujer", label: "Mujer" },
    { id: "unisex", label: "Unisex" },
  ],
  disciplines: [],
  garments: [
    { id: "camiseta", label: "Camisetas de Partido", chip: "Camisetas de Partido" },
    { id: "pantalon", label: "Pantalones de Entrenamiento", chip: "Pantalones de Entrenamiento" },
    { id: "short", label: "Shorts Técnicos", chip: "Shorts Técnicos" },
    {
      id: "chaqueta",
      label: "Térmicas y Cortavientos",
      types: ["chaqueta", "sudadera"],
      chip: "Térmicas y Cortavientos",
    },
    { id: "accesorio", label: "Botas, Guantes & Medias", chip: "Botas y Accesorios" },
    { id: "compresion", label: "Ropa de Compresión" },
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#2563EB", label: "Azul" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#374151", label: "Grafito" },
    { value: "#FFFFFF", label: "Blanco" },
  ],
  features: [
    { id: "compresion", label: "Compresión anatómica" },
    { id: "ripstop", label: "Micro-Ripstop anti-desgarro" },
    { id: "dwr", label: "Repelente al agua (DWR)" },
    { id: "antiabrasion", label: "Paneles anti-abrasión" },
    { id: "dryfit", label: "Tejido transpirable DryFit" },
  ],
  help: {
    sizeTitle: "Guía de Tallas Fútbol (Hombre y Mujer)",
    sizeText:
      "Patronaje atlético optimizado para competición. Diseños específicos para morfología masculina y femenina con guías precisas en centímetros de contorno y largo.",
    sizeLink: "Consultar tabla de medidas (cm)",
    guaranteeTitle: "Garantía Pro-Athlete 30 Días",
    guaranteeText:
      "Equipaciones testadas en césped natural y sintético: resistencia al agarre, fricción de entrada y secado ultra rápido en condiciones de máxima exigencia.",
    shippingTitle: "Envíos y Cambios Gratis en 24/48h",
    shippingText:
      "Recibe tu equipación en 24/48 horas con entrega exprés garantizada. Cambios de talla gratuitos a domicilio o en puntos de recogida autorizados.",
  },
};

/** Ropa de running de hombre y mujer (#/running): chips por tipo de prenda. */
export const RUNNING_CATALOG: CatalogConfig = {
  slug: "running",
  crumb: "Deportes",
  crumbHref: "#/catalogo",
  crumbCurrent: "Running · Ropa de Running",
  categories: ["running"],
  chips: "garments",
  allChip: "Todos (Hombre y Mujer)",
  icon: "directions_run",
  scope: "de running",
  sizeLegend: "Talla (Hombre / Mujer)",
  eyebrow: "Colección oficial running 2026",
  title: "Ropa de Running · Velocidad, Ligereza y Transpirabilidad",
  intro:
    "Prendas aerodinámicas ultraligeras, cortavientos DWR, mallas compresivas y shorts técnicos para asfalto, pista y maratón. Modeladas en 3D con relieve puro de producto.",
  audiences: [
    { id: "hombre", label: "Hombre" },
    { id: "mujer", label: "Mujer" },
    { id: "unisex", label: "Unisex" },
  ],
  disciplines: [],
  garments: [
    {
      id: "camiseta",
      label: "Camisetas, Tops & Singlets",
      types: ["camiseta", "top"],
      chip: "Camisetas y Singlets",
    },
    {
      id: "short",
      label: "Shorts 2-en-1 & Mallas Compresivas",
      types: ["short", "compresion"],
      chip: "Shorts y Mallas Compresivas",
    },
    {
      id: "chaqueta",
      label: "Cortavientos & Chaquetas",
      types: ["chaqueta", "sudadera"],
      chip: "Cortavientos Ultraligeros",
    },
    { id: "pantalon", label: "Pantalones & Leggings", chip: "Pantalones y Leggings" },
    { id: "accesorio", label: "Zapatillas & Accesorios", chip: "Zapatillas y Accesorios" },
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#2563EB", label: "Azul" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#374151", label: "Grafito" },
    { value: "#AE3200", label: "Terracota" },
  ],
  features: [
    { id: "compresion", label: "Compresión anatómica" },
    { id: "reflectante", label: "Detalles Reflectantes 360°" },
    { id: "dryfit", label: "Tejido Ultraligero Transpirable" },
    { id: "dwr", label: "Repelente al agua (DWR)" },
  ],
  help: {
    sizeTitle: "Guía de Pisada y Tallas Running",
    sizeText:
      "Patronaje atlético optimizado para zancada biomecánica. Diseños específicos para morfología masculina y femenina con guías precisas en centímetros de contorno y largo.",
    sizeLink: "Consultar tabla de medidas (cm)",
    guaranteeTitle: "Garantía Pro-Athlete 30 Días",
    guaranteeText:
      "Equipaciones testadas en asfalto, pista y maratón: resistencia a la rozadura, ventilación continua y secado ultra rápido en condiciones de máxima exigencia.",
    shippingTitle: "Envíos y Devoluciones Gratis en 24/48h",
    shippingText:
      "Recibe tu equipación en 24/48 horas con entrega exprés garantizada. Cambios de talla gratuitos a domicilio o en puntos de recogida autorizados.",
  },
};

/** Ropa casual y athleisure de hombre y mujer (#/athleisure): chips por tipo de prenda. */
export const ATHLEISURE_CATALOG: CatalogConfig = {
  slug: "athleisure",
  crumb: "Deportes",
  crumbHref: "#/catalogo",
  crumbCurrent: "Athleisure · Ropa Casual",
  categories: ["athleisure"],
  chips: "garments",
  allChip: "Todos (Hombre y Mujer)",
  scope: "de athleisure",
  sizeLegend: "Talla (Hombre / Mujer)",
  eyebrow: "Colección oficial athleisure 2026",
  title: "Ropa Casual & Athleisure · Máximo Confort, Estilo y Calidad",
  intro:
    "Prendas relajadas, tejidos premium y acabados técnicos de tacto ultra suave para el día a día. Modeladas en 3D con relieve puro de producto.",
  audiences: [
    { id: "hombre", label: "Hombre" },
    { id: "mujer", label: "Mujer" },
    { id: "unisex", label: "Unisex" },
  ],
  disciplines: [],
  garments: [
    { id: "sudadera", label: "Sudaderas & Hoodies", chip: "Sudaderas y Hoodies" },
    {
      id: "pantalon",
      label: "Pantalones Jogger, Chinos & Bermudas",
      types: ["pantalon", "short"],
      chip: "Pantalones Jogger",
    },
    {
      id: "camiseta",
      label: "Tops, Camisetas, Polos & Vestidos",
      types: ["camiseta", "top", "vestido"],
      chip: "Tops y Camisetas Casual",
    },
    { id: "chaqueta", label: "Chaquetas & Cortavientos", chip: "Chaquetas y Capas" },
    { id: "accesorio", label: "Bolsas & Accesorios", chip: "Bolsas y Accesorios" },
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: [
    { value: "#111827", label: "Negro" },
    { value: "#1E293B", label: "Azul noche" },
    { value: "#FF5A1F", label: "Naranja NEXFIT" },
    { value: "#E5E0D8", label: "Arena" },
    { value: "#4B5D3A", label: "Verde oliva" },
    { value: "#374151", label: "Grafito" },
    { value: "#AE3200", label: "Terracota" },
    { value: "#C4999B", label: "Rosa palo" },
    { value: "#FFFFFF", label: "Blanco" },
  ],
  features: [
    { id: "french_terry", label: "Tejido French Terry cepillado" },
    { id: "oversize", label: "Corte relajado / Oversize" },
    { id: "bolsillos_zip", label: "Bolsillos termosellados con cremallera" },
    { id: "antipilling", label: "Tratamiento anti-pilling" },
  ],
  help: {
    sizeTitle: "Guía de Tallas y Ajustes Casual",
    sizeText:
      "Encuentra tu fit perfecto para hombre y mujer con recomendaciones biométricas exactas.",
    sizeLink: "Consultar recomendador de tallas",
    guaranteeTitle: "Garantía Confort Pro 30 Días",
    guaranteeText:
      "Pruébalo en tu rutina diaria. Si no sientes confort total, te devolvemos el dinero sin preguntas.",
    guaranteeNote: "100% satisfacción garantizada",
    shippingTitle: "Envíos y Cambios Gratis en 24/48h",
    shippingText:
      "Entrega ultra rápida en península y servicio de recogida para cambios sin coste adicional.",
    shippingNote: "Portes gratis en compras > 50 €",
  },
};
