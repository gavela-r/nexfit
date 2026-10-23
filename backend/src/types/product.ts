// types/product.ts
// Modelos de dominio compartidos por servicios, controladores y rutas.

export interface ProductColor {
  value: string;
  /** Clases extra (p. ej. borde para el color blanco). */
  className?: string;
}

export interface ProductBadge {
  label: string;
  className: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  /** Slug de la categoría (futbol, running...), para filtrar sin depender del texto. */
  categorySlug: string;
  rating: number;
  badge: ProductBadge;
  image: string;
  favorited: boolean;
  sizes: string[];
  defaultSize: string;
  colors: ProductColor[];
  price: number;
  originalPrice?: number;
  /** Público objetivo (hombre, mujer o unisex). */
  audience: Audience;
  /** Tipo de prenda (camiseta, pantalon...), para los filtros del catálogo. */
  garmentType?: string;
  /** Propiedades técnicas: compresion, ripstop, dwr, antiabrasion. */
  features: string[];
  subtitle?: string;
  description?: string;
}

export type Audience = "hombre" | "mujer" | "unisex";

export interface Category {
  slug: string;
  label: string;
  items: number;
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  /** Precio unitario congelado al añadir la línea. */
  unitPrice: number;
  /** Datos de apoyo para pintar el carrito (los añade el servicio desde products). */
  name?: string;
  image?: string;
  /** Etiqueta de la categoría (badge del panel de la cesta). */
  category?: string;
  /** Nombre comercial del color («Verde pino», «Negro»...). */
  colorName?: string;
}

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
}
