-- ============================================================================
--  NEXFIT · Base de datos completa
--  Tienda de ropa deportiva técnica y athleisure
-- ----------------------------------------------------------------------------
--  Motor ............ MySQL 8.0.16 o superior (probado en MySQL 8.0.46)
--  Almacenamiento ... InnoDB
--  Codificación ..... utf8mb4 / utf8mb4_0900_ai_ci (acentos, ñ y emojis)
--  Fichero .......... UTF-8. Importar de una sola vez.
--
--  CÓMO IMPORTARLO
--    · phpMyAdmin .... pestaña «Importar» → elegir nexfit.sql → Continuar
--    · MySQL Workbench / DBeaver ... File → Run SQL Script → nexfit.sql
--    · Terminal ..... mysql -u root -p < nexfit.sql
--
--  QUÉ CREA
--    1. Catálogo ....... categories, products, product_sizes, product_colors
--    2. Cuentas ........ users, sessions, favorites
--    3. Carrito ........ carts, cart_items
--    4. Newsletter ..... newsletter_subscribers
--    5. Pedidos ........ orders, order_items
--    6. Vistas ......... v_catalog, v_cart_totals
--    7. Datos .......... 7 categorías + 90 productos (38 de hombre, 29 de mujer, 23 unisex) + cuenta de ejemplo
--
--  El script es idempotente: se puede volver a ejecutar y deja la base de
--  datos limpia (borra y recrea las tablas). Los datos transaccionales de
--  ejemplo (carrito y pedido) están en la última sección, marcados como
--  opcionales.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS nexfit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

-- Si la base ya existía con otra colación, se normaliza en cada ejecución.
ALTER DATABASE nexfit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE nexfit;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ----------------------------------------------------------------------------
--  Limpieza previa (por si el script ya se ejecutó antes)
-- ----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_cart_totals;
DROP VIEW IF EXISTS v_catalog;

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS product_colors;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS newsletter_subscribers;
DROP TABLE IF EXISTS categories;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
--  1. CATÁLOGO
-- ============================================================================

-- ----------------------------------------------------------------------------
--  categories · disciplinas deportivas de la portada
--  items_count es el contador promocional que muestra la home; en una tienda
--  real se calcularía con COUNT(*) sobre products.
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(60)      NOT NULL COMMENT 'Identificador para las URLs: fitness, running...',
  label       VARCHAR(90)      NOT NULL COMMENT 'Nombre visible en la web',
  items_count INT UNSIGNED     NOT NULL DEFAULT 0 COMMENT 'Contador mostrado en la portada',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orden de aparición',
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Disciplinas deportivas del catálogo';

-- ----------------------------------------------------------------------------
--  products · catálogo
--  El id es el SKU público que ya usa la API (nex-01...), así el frontend
--  puede seguir trabajando con el mismo identificador.
--
--  badge_tone guarda el SIGNIFICADO del distintivo, nunca clases CSS:
--    nuevo      → naranja secundario (bg-secondary)
--    oferta     → naranja principal  (bg-primary)
--    tecnico    → oscuro             (bg-slate-900)
--    tendencia  → claro              (bg-slate-200)
--    bestseller → oscuro             (bg-slate-900)
--    soporte    → naranja principal  (bg-primary)
--  El frontend traduce ese valor a las clases de Tailwind que correspondan.
-- ----------------------------------------------------------------------------
CREATE TABLE products (
  id             VARCHAR(20)      NOT NULL COMMENT 'SKU público: nex-01',
  category_id    INT UNSIGNED     NOT NULL,
  name           VARCHAR(120)     NOT NULL,
  audience       ENUM('hombre', 'mujer', 'unisex') NOT NULL DEFAULT 'unisex'
                                  COMMENT 'Público objetivo (menú Hombre / Mujer)',
  garment_type   ENUM('camiseta', 'pantalon', 'short', 'chaqueta', 'sudadera', 'compresion', 'top', 'vestido', 'accesorio') NULL
                                  COMMENT 'Tipo de prenda (filtro del catálogo)',
  features       SET('compresion', 'ripstop', 'dwr', 'antiabrasion', 'squatproof', 'dryfit', 'cintura_alta', 'reflectante',
                                  'french_terry', 'oversize', 'bolsillos_zip', 'antipilling') NULL
                                  COMMENT 'Propiedades técnicas (filtro «Ajuste & Propiedades»)',
  subtitle       VARCHAR(60)      NULL COMMENT 'Línea superior de la tarjeta: «Running · Clima Adverso»',
  description    VARCHAR(255)     NULL COMMENT 'Descripción breve de la tarjeta',
  price         DECIMAL(10, 2)   NOT NULL,
  original_price DECIMAL(10, 2)   NULL COMMENT 'Precio antes de la rebaja; NULL si no está de oferta',
  rating         DECIMAL(2, 1)    NOT NULL DEFAULT 0.0 COMMENT 'Media de valoraciones (0-5)',
  badge_label    VARCHAR(40)      NULL COMMENT 'Texto del distintivo: Nuevo, Oferta -20%...',
  badge_tone     ENUM('nuevo', 'oferta', 'tecnico', 'tendencia', 'bestseller', 'soporte') NULL
                                  COMMENT 'Estilo semántico del distintivo (sin CSS en la BD)',
  image_url      VARCHAR(700)     NOT NULL,
  default_size   VARCHAR(10)      NOT NULL COMMENT 'Talla preseleccionada en la ficha',
  is_active      TINYINT(1)       NOT NULL DEFAULT 1 COMMENT '0 = oculto en la tienda',
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_active (is_active),
  KEY idx_products_price (price),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_original_price
    CHECK (original_price IS NULL OR original_price > price),
  CONSTRAINT chk_products_rating CHECK (rating BETWEEN 0 AND 5)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Productos de la tienda';

-- ----------------------------------------------------------------------------
--  product_sizes · tallas y stock por producto
-- ----------------------------------------------------------------------------
CREATE TABLE product_sizes (
  product_id VARCHAR(20)      NOT NULL,
  size       VARCHAR(10)      NOT NULL COMMENT 'XS, S, M, L, XL...',
  stock      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Orden en los selectores',
  PRIMARY KEY (product_id, size),
  KEY idx_sizes_size (size),
  CONSTRAINT fk_sizes_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_sizes_stock CHECK (stock >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Tallas disponibles y unidades en almacén';

-- ----------------------------------------------------------------------------
--  product_colors · muestras de color por producto
--  has_border = 1 para colores claros (blanco, arena) que necesitan un borde
--  y así no se fundan con el fondo blanco de la tarjeta.
-- ----------------------------------------------------------------------------
CREATE TABLE product_colors (
  product_id VARCHAR(20)      NOT NULL,
  color_hex  CHAR(7)          NOT NULL COMMENT 'Color en formato #RRGGBB',
  color_name VARCHAR(40)      NULL COMMENT 'Nombre comercial: Negro, Arena...',
  has_border TINYINT(1)       NOT NULL DEFAULT 0,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, color_hex),
  CONSTRAINT fk_colors_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_colors_hex CHECK (color_hex REGEXP '^#[0-9A-Fa-f]{6}$')
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Colores disponibles de cada producto';

-- ============================================================================
--  2. CUENTAS
-- ============================================================================

-- ----------------------------------------------------------------------------
--  users · cuentas registradas
--  password_hash guarda «sal:hash» generado con scrypt (backend/src/utils/
--  password.ts). Nunca se guarda la contraseña en claro.
--  El email es único y la colación utf8mb4_0900_ai_ci hace que no se pueda
--  registrar dos veces el mismo correo cambiando mayúsculas.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            VARCHAR(20)  NOT NULL COMMENT 'Identificador público: usr-a1b2c3d4',
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'Formato scrypt: sal(hex):hash(hex)',
  role          ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT chk_users_name CHECK (CHAR_LENGTH(name) >= 2),
  CONSTRAINT chk_users_email CHECK (email LIKE '%_@_%._%')
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Cuentas de la tienda';

-- ----------------------------------------------------------------------------
--  sessions · tokens de sesión (Bearer)
--  token = 32 bytes aleatorios en hexadecimal (64 caracteres), igual que los
--  que genera hoy el backend en memoria.
-- ----------------------------------------------------------------------------
CREATE TABLE sessions (
  token        CHAR(64)  NOT NULL,
  user_id      VARCHAR(20) NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME  NULL COMMENT 'NULL = sin caducidad (modo demo)',
  last_used_at DATETIME  NULL,
  PRIMARY KEY (token),
  KEY idx_sessions_user (user_id),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Sesiones abiertas (token → usuario)';

-- ----------------------------------------------------------------------------
--  favorites · favoritos por usuario (el corazón de la cabecera)
--  Sustituye al flag «favorited» que la demo tenía fijo en el catálogo.
-- ----------------------------------------------------------------------------
CREATE TABLE favorites (
  user_id    VARCHAR(20) NOT NULL,
  product_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  KEY idx_favorites_product (product_id),
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Productos marcados como favoritos';

-- ============================================================================
--  3. CARRITO
-- ============================================================================

-- ----------------------------------------------------------------------------
--  carts · una cesta por usuario o por invitado
--  Mientras status = 'abierto' se reutiliza la misma fila; al pagar pasa a
--  'convertido' y el pedido se guarda en orders.
-- ----------------------------------------------------------------------------
CREATE TABLE carts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     VARCHAR(20)     NULL COMMENT 'NULL si la cesta es de un invitado',
  guest_token CHAR(64)        NULL COMMENT 'Identificador del invitado (cookie/localStorage)',
  status      ENUM('abierto', 'convertido', 'abandonado') NOT NULL DEFAULT 'abierto',
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_carts_user (user_id),
  KEY idx_carts_guest (guest_token),
  CONSTRAINT fk_carts_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Cestas de la compra';

-- ----------------------------------------------------------------------------
--  cart_items · líneas del carrito
--  unit_price congela el precio del momento en que se añadió la línea, para
--  que un cambio de precio no altere una cesta ya empezada.
--  Las claves foráneas compuestas garantizan que la talla y el color elegidos
--  existen realmente en ese producto.
-- ----------------------------------------------------------------------------
CREATE TABLE cart_items (
  id         BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  cart_id    BIGINT UNSIGNED  NOT NULL,
  product_id VARCHAR(20)      NOT NULL,
  size       VARCHAR(10)      NOT NULL,
  color_hex  CHAR(7)          NOT NULL,
  quantity   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2)   NOT NULL COMMENT 'Precio congelado al añadir la línea',
  added_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_line (cart_id, product_id, size, color_hex),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT fk_cart_items_cart
    FOREIGN KEY (cart_id) REFERENCES carts (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_size
    FOREIGN KEY (product_id, size) REFERENCES product_sizes (product_id, size)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_color
    FOREIGN KEY (product_id, color_hex) REFERENCES product_colors (product_id, color_hex)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_cart_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT chk_cart_items_price CHECK (unit_price >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Líneas de cada cesta';

-- ============================================================================
--  4. NEWSLETTER (Club NEXFIT)
-- ============================================================================

CREATE TABLE newsletter_subscribers (
  email         VARCHAR(160) NOT NULL,
  subscribed_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed     TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = correo confirmado (doble opt-in)',
  source        VARCHAR(40)  NULL COMMENT 'footer, popup, checkout...',
  PRIMARY KEY (email),
  CONSTRAINT chk_newsletter_email CHECK (email LIKE '%_@_%._%')
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Suscripciones al Club NEXFIT';

-- ============================================================================
--  5. PEDIDOS
-- ============================================================================

-- ----------------------------------------------------------------------------
--  orders · cabecera del pedido
--  Los datos de envío se copian en el pedido: si el usuario cambia su
--  dirección, el histórico no se altera.
-- ----------------------------------------------------------------------------
CREATE TABLE orders (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number        VARCHAR(16)     NOT NULL COMMENT 'Número visible: NXF-000001',
  user_id             VARCHAR(20)     NULL COMMENT 'NULL en compras como invitado',
  status              ENUM('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado', 'devuelto')
                                      NOT NULL DEFAULT 'pendiente',
  subtotal            DECIMAL(10, 2)  NOT NULL DEFAULT 0,
  shipping_cost       DECIMAL(10, 2)  NOT NULL DEFAULT 0,
  discount            DECIMAL(10, 2)  NOT NULL DEFAULT 0,
  total               DECIMAL(10, 2)  NOT NULL DEFAULT 0,
  currency            CHAR(3)         NOT NULL DEFAULT 'EUR',
  payment_method      VARCHAR(40)     NULL COMMENT 'tarjeta, paypal, bizum, contrarreembolso',
  shipping_name       VARCHAR(80)     NULL,
  shipping_email      VARCHAR(160)    NULL,
  shipping_phone      VARCHAR(25)     NULL,
  shipping_address    VARCHAR(160)    NULL,
  shipping_city       VARCHAR(80)     NULL,
  shipping_postal_code VARCHAR(12)    NULL,
  shipping_country    CHAR(2)         NOT NULL DEFAULT 'ES',
  notes               VARCHAR(255)    NULL,
  created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  KEY idx_orders_created (created_at),
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_orders_amounts CHECK (subtotal >= 0 AND shipping_cost >= 0 AND discount >= 0 AND total >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Cabecera de los pedidos';

-- ----------------------------------------------------------------------------
--  order_items · líneas del pedido
--  Guardan copia del nombre, la talla y el color: el histórico debe seguir
--  siendo legible aunque el producto cambie o se retire del catálogo.
--  line_total es una columna generada (precio × cantidad).
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
  id           BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id     BIGINT UNSIGNED  NOT NULL,
  product_id   VARCHAR(20)      NULL COMMENT 'NULL si el producto se elimina del catálogo',
  product_name VARCHAR(120)     NOT NULL COMMENT 'Copia congelada del nombre',
  size         VARCHAR(10)      NOT NULL,
  color_hex    CHAR(7)          NOT NULL,
  quantity     TINYINT UNSIGNED NOT NULL,
  unit_price   DECIMAL(10, 2)   NOT NULL,
  line_total   DECIMAL(10, 2)   AS (unit_price * quantity) STORED,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_order_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT chk_order_items_price CHECK (unit_price >= 0)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
  COMMENT = 'Líneas de cada pedido';

-- ============================================================================
--  6. VISTAS
-- ============================================================================

-- ----------------------------------------------------------------------------
--  v_catalog · catálogo listo para pintar la parrilla de productos:
--  categoría, tallas y colores juntos en una sola consulta.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_catalog AS
SELECT
  p.id,
  p.name,
  p.audience,
  p.garment_type,
  p.features,
  p.subtitle,
  p.description,
  c.slug                                            AS category_slug,
  c.label                                           AS category_label,
  p.price,
  p.original_price,
  CASE
    WHEN p.original_price IS NOT NULL AND p.original_price > 0
      THEN ROUND((1 - p.price / p.original_price) * 100)
    ELSE NULL
  END                                               AS discount_percent,
  p.rating,
  p.badge_label,
  p.badge_tone,
  p.image_url,
  p.default_size,
  (SELECT GROUP_CONCAT(ps.size ORDER BY ps.sort_order, ps.size SEPARATOR ',')
     FROM product_sizes ps WHERE ps.product_id = p.id)  AS sizes,
  (SELECT GROUP_CONCAT(pc.color_hex ORDER BY pc.sort_order, pc.color_hex SEPARATOR ',')
     FROM product_colors pc WHERE pc.product_id = p.id) AS colors,
  (SELECT COALESCE(SUM(ps.stock), 0)
     FROM product_sizes ps WHERE ps.product_id = p.id)  AS stock_total,
  (SELECT COUNT(*) FROM favorites f WHERE f.product_id = p.id) AS favorites_count
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = 1;

-- ----------------------------------------------------------------------------
--  v_cart_totals · totales de cada cesta sin sumarlos en el backend.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_cart_totals AS
SELECT
  c.id                                  AS cart_id,
  c.user_id,
  c.guest_token,
  c.status,
  COUNT(ci.id)                          AS line_count,
  COALESCE(SUM(ci.quantity), 0)         AS units,
  COALESCE(SUM(ci.unit_price * ci.quantity), 0) AS subtotal
FROM carts c
LEFT JOIN cart_items ci ON ci.cart_id = c.id
GROUP BY c.id, c.user_id, c.guest_token, c.status;

-- ============================================================================
--  7. DATOS
-- ============================================================================

START TRANSACTION;

-- ----------------------------------------------------------------------------
--  7.1 Categorías (las seis disciplinas de la portada)
-- ----------------------------------------------------------------------------
INSERT INTO categories (slug, label, items_count, sort_order) VALUES
  ('fitness',    'Fitness / Gimnasio',      142, 1),
  ('running',    'Running',                  89, 2),
  ('athleisure', 'Athleisure / Casual',     115, 3),
  ('futbol',     'Fútbol',                   64, 4),
  ('crossfit',   'CrossFit / Entrenamiento',  78, 5),
  ('outdoor',    'Outdoor',                  93, 6),
  ('yoga',       'Yoga & Pilates',           57, 7);

-- ----------------------------------------------------------------------------
--  7.2 Productos reales del catálogo
-- ----------------------------------------------------------------------------
INSERT INTO products
  (id, category_id, name, audience, price, original_price, rating,
   badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-01',
   (SELECT id FROM categories WHERE slug = 'fitness'),
   'Camiseta Técnica Transpirable NEX-Pro', 'unisex', 34.95, NULL, 4.9,
   'Nuevo', 'nuevo',
   '/assets/images/product-nex-01.jpg',
   'M', 1),

  ('nex-02',
   (SELECT id FROM categories WHERE slug = 'running'),
   'Mallas de Compresión HyperMotion Mujer', 'mujer', 49.95, 62.00, 5.0,
   'Oferta -20%', 'oferta',
   '/assets/images/product-nex-02.jpg',
   'XS', 1),

  ('nex-03',
   (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Chaqueta Cortavientos StormRun', 'unisex', 69.90, NULL, 4.8,
   'Técnico', 'tecnico',
   '/assets/images/product-nex-03.jpg',
   'L', 1),

  ('nex-04',
   (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Athleisure Oversize Fleece', 'unisex', 55.00, NULL, 4.7,
   'Tendencia', 'tendencia',
   '/assets/images/product-nex-04.jpg',
   'M', 1),

  ('nex-05',
   (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Pantalón Corto 2 en 1 TrainReady', 'unisex', 32.50, NULL, 4.9,
   'Best Seller', 'bestseller',
   '/assets/images/product-nex-05.jpg',
   'L', 1),

  ('nex-06',
   (SELECT id FROM categories WHERE slug = 'running'),
   'Top Deportivo Impact Control', 'mujer', 28.95, NULL, 4.9,
   'Soporte Alto', 'soporte',
   '/assets/images/product-nex-06.jpg',
   'S', 1);

-- ----------------------------------------------------------------------------
--  7.2 bis Colección Hombre (página «Ropa Deportiva de Hombre», #/hombre)
--      Además de la categoría llevan tipo de prenda, propiedades técnicas,
--      subtítulo y descripción, que alimentan los filtros del catálogo.
--      Fotos de producto en frontend/public/assets/images/hombre/; los productos
--      que aún no tienen la suya (nex-13 a nex-18, nex-21, nex-23, nex-32, nex-35
--      y nex-36) reutilizan una foto existente de la tienda.
-- ----------------------------------------------------------------------------
INSERT INTO products
  (id, category_id, name, audience, garment_type, features, subtitle, description,
   price, original_price, rating, badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-07', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Camiseta Oficial Match Pro', 'hombre', 'camiseta', NULL,
   'Fútbol · Torneo Oficial',
   'Estructura panal de abeja hiperventilada con costuras planas ergonómicas.',
   49.95, NULL, 4.8, 'Oficial Match', 'oferta',
   '/assets/images/hombre/nex-07-camiseta-match.webp', 'M', 1),

  ('nex-08', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Short Compresión CrossFit Pro', 'hombre', 'compresion', 'compresion,antiabrasion',
   'CrossFit & Powerlifting',
   'Refuerzo quad con sujeción muscular reactiva para sentadillas y rozamiento de barra.',
   42.50, 55.00, 4.9, 'Anti-abrasión', 'nuevo',
   '/assets/images/hombre/nex-08-short-compresion.webp', 'L', 1),

  ('nex-09', (SELECT id FROM categories WHERE slug = 'running'),
   'Cortavientos Velocity Wind', 'hombre', 'chaqueta', 'ripstop,reflectante',
   'Running · Clima Adverso',
   'Nylon técnico 12D de solo 110 gramos con ribetes reflectantes y corte ergonómico.',
   79.00, NULL, 4.8, 'Micro-Ripstop 360°', 'nuevo',
   '/assets/images/hombre/nex-09-cortavientos.webp', 'L', 1),

  ('nex-10', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Pantalón Técnico Articulado Alpine', 'hombre', 'pantalon', 'ripstop,dwr,antiabrasion',
   'Outdoor · Trekking Técnico',
   'Rodillas premoldeadas anatómicas y bolsillos sellados con cremalleras estancas.',
   89.90, NULL, 4.7, 'Waterproof DWR', 'tecnico',
   '/assets/images/hombre/nex-10-pantalon-trekking.webp', 'L', 1),

  ('nex-11', (SELECT id FROM categories WHERE slug = 'running'),
   'Short 2-en-1 Running Velocity', 'hombre', 'short', 'compresion',
   'Running & Maratón',
   'Capa externa ultraligera y malla interna compresiva anti-roce con bolsillo para gel.',
   38.00, 48.00, 4.9, '2-en-1 Integrado', 'oferta',
   '/assets/images/hombre/nex-11-short-2en1.webp', 'L', 1),

  ('nex-12', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Jogger Tapered Stealth Carbón', 'hombre', 'pantalon', NULL,
   'Fitness / Athleisure',
   'Tejido French Terry elástico en cuatro direcciones con puños ajustados al tobillo.',
   54.90, NULL, 4.6, 'Fit Cónico 3D', 'tecnico',
   '/assets/images/hombre/nex-12-jogger.webp', 'M', 1),

  ('nex-13', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Camiseta Técnica Gym Dry-Core', 'hombre', 'camiseta', NULL,
   'Fitness · Gimnasio',
   'Punto técnico de secado rápido con paneles de ventilación láser en la espalda.',
   29.95, NULL, 4.7, 'Best Seller', 'bestseller',
   '/assets/images/product-nex-01.jpg', 'M', 1),

  ('nex-14', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Pantalón Entreno Fútbol Tactic', 'hombre', 'pantalon', 'ripstop',
   'Fútbol · Entrenamiento',
   'Pernera cónica con cremallera al tobillo y tejido ripstop resistente al desgarro.',
   44.95, NULL, 4.6, 'Técnico', 'tecnico',
   '/assets/images/hombre/nex-12-jogger.webp', 'M', 1),

  ('nex-15', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Camiseta Compresión Hyper-Grip', 'hombre', 'compresion', 'compresion,antiabrasion',
   'CrossFit · WOD',
   'Compresión graduada en hombros y dorsales con refuerzo anti-abrasión para rope climb.',
   39.95, 49.95, 4.8, 'Oferta -20%', 'oferta',
   '/assets/images/product-nex-01.jpg', 'L', 1),

  ('nex-16', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Chaqueta Shell Storm Ridge', 'hombre', 'chaqueta', 'ripstop,dwr',
   'Outdoor · Alta Montaña',
   'Membrana 3 capas 20K con costuras termoselladas y capucha compatible con casco.',
   139.00, NULL, 4.9, 'Nuevo', 'nuevo',
   '/assets/images/product-nex-03.jpg', 'L', 1),

  ('nex-17', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Half-Zip Recovery', 'hombre', 'sudadera', 'french_terry',
   'Athleisure · Recuperación',
   'Interior cepillado ultrasuave con media cremallera y bolsillo canguro oculto.',
   59.90, NULL, 4.7, 'Tendencia', 'tendencia',
   '/assets/images/product-nex-04.jpg', 'L', 1),

  ('nex-18', (SELECT id FROM categories WHERE slug = 'running'),
   'Mallas Largas Compresión Pace', 'hombre', 'compresion', 'compresion,dwr',
   'Running · Invierno',
   'Compresión muscular en gemelo y cuádriceps con acabado repelente al agua.',
   47.50, 59.00, 4.8, 'Oferta -19%', 'oferta',
   '/assets/images/product-nex-05.jpg', 'M', 1),

  ('nex-19', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Sudadera Entreno Half-Zip Pressing', 'hombre', 'sudadera', NULL,
   'Fútbol · Entrenamiento',
   'Punto técnico ligero con media cremallera, cuello alto y franjas de contraste en los hombros.',
   44.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/hombre/nex-19-sudadera-training.jpg', 'M', 1),

  ('nex-20', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Short Match Day Velocity', 'hombre', 'short', NULL,
   'Fútbol · Partido',
   'Corte ligero con abertura lateral para zancada libre y cintura elástica con cordón interior.',
   32.00, 40.00, 4.6, 'Oferta -20%', 'oferta',
   '/assets/images/hombre/nex-20-short-match.jpg', 'M', 1),

  ('nex-21', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Chaqueta Banquillo Thermo Pitch', 'hombre', 'chaqueta', 'dwr',
   'Fútbol · Banquillo',
   'Relleno sintético ligero con acabado repelente al agua y puños elásticos cortaviento.',
   89.00, NULL, 4.8, 'Técnico', 'tecnico',
   '/assets/images/hombre/nex-09-cortavientos.webp', 'L', 1),

  ('nex-22', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Camiseta Sin Mangas WOD Burn', 'hombre', 'camiseta', 'antiabrasion',
   'CrossFit · WOD',
   'Sisa amplia para máxima movilidad de hombros y paneles anti-abrasión en la espalda baja.',
   30.95, NULL, 4.7, 'Tendencia', 'tendencia',
   '/assets/images/hombre/nex-22-tank-wod.jpg', 'M', 1),

  ('nex-23', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Short Entreno Barbell Flex', 'hombre', 'short', 'ripstop,antiabrasion',
   'CrossFit · Halterofilia',
   'Tejido ripstop elástico en 4 direcciones con refuerzo en muslo para cleans y snatches.',
   44.90, 52.00, 4.8, 'Oferta -14%', 'oferta',
   '/assets/images/hombre/nex-11-short-2en1.webp', 'L', 1),

  ('nex-24', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Sudadera Sin Mangas Hoodie Grind', 'hombre', 'sudadera', NULL,
   'CrossFit · Calentamiento',
   'Felpa técnica sin mangas con capucha para calentar sin limitar el movimiento de los hombros.',
   49.95, NULL, 4.9, 'Best Seller', 'bestseller',
   '/assets/images/hombre/nex-24-hoodie-sin-mangas.jpg', 'L', 1),

  ('nex-25', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Camiseta Raglan Iron Training', 'hombre', 'camiseta', NULL,
   'Fitness · Gimnasio',
   'Manga raglán que acompaña el hombro en press y dominadas, con tejido jaspeado transpirable.',
   32.50, NULL, 4.6, 'Nuevo', 'nuevo',
   '/assets/images/hombre/nex-25-camiseta-raglan.jpg', 'L', 1),

  ('nex-26', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Camiseta Half-Zip Thermo Gym', 'hombre', 'camiseta', 'reflectante',
   'Fitness · Calentamiento',
   'Manga larga con media cremallera, puños con orificio para el pulgar y franjas reflectantes.',
   44.95, 54.95, 4.7, 'Oferta -18%', 'oferta',
   '/assets/images/hombre/nex-26-half-zip-thermo.jpg', 'M', 1),

  ('nex-27', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Camiseta Compresión Seamless Core', 'hombre', 'compresion', 'compresion',
   'Fitness · Base Layer',
   'Tejido sin costuras con zonas de compresión mapeadas y vivos de contraste en los costados.',
   36.95, NULL, 4.8, 'Técnico', 'tecnico',
   '/assets/images/hombre/nex-27-compresion-core.jpg', 'M', 1),

  ('nex-28', (SELECT id FROM categories WHERE slug = 'running'),
   'Camiseta Tirantes Aero Mesh', 'hombre', 'camiseta', 'reflectante',
   'Running · Competición',
   'Espalda nadadora, perforaciones láser para ventilar y detalles reflectantes para salir de noche.',
   35.00, NULL, 4.8, 'Nuevo', 'nuevo',
   '/assets/images/hombre/nex-28-tirantes-running.jpg', 'M', 1),

  ('nex-29', (SELECT id FROM categories WHERE slug = 'running'),
   'Malla 3/4 Compresión Stride', 'hombre', 'compresion', 'compresion',
   'Running · Ritmo',
   'Compresión en cuádriceps y gemelo, bolsillo trasero con cremallera y paneles de contraste.',
   44.90, 54.90, 4.7, 'Oferta -18%', 'oferta',
   '/assets/images/hombre/nex-29-malla-3-4.jpg', 'M', 1),

  ('nex-30', (SELECT id FROM categories WHERE slug = 'running'),
   'Short Running Velocity Pocket', 'hombre', 'short', 'reflectante',
   'Running · Entrenamiento',
   'Tejido ligero con bolsillo lateral para el móvil, aberturas laterales y ribetes reflectantes.',
   38.50, NULL, 4.9, 'Tendencia', 'tendencia',
   '/assets/images/hombre/nex-30-short-running-pocket.jpg', 'M', 1),

  ('nex-31', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Camiseta Merino Half-Zip Ridge', 'hombre', 'camiseta', NULL,
   'Outdoor · Trail',
   'Lana merino con media cremallera, costuras planas y puños con orificio para el pulgar.',
   54.95, NULL, 4.8, 'Tendencia', 'tendencia',
   '/assets/images/hombre/nex-31-merino-half-zip.jpg', 'M', 1),

  ('nex-32', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Pantalón Convertible Summit Zip', 'hombre', 'pantalon', 'ripstop,dwr',
   'Outdoor · Trekking',
   'Perneras desmontables con cremallera, tejido ripstop elástico y acabado repelente al agua.',
   79.95, NULL, 4.7, 'Waterproof DWR', 'tecnico',
   '/assets/images/hombre/nex-10-pantalon-trekking.webp', 'L', 1),

  ('nex-33', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Chaqueta Softshell Granite', 'hombre', 'chaqueta', 'dwr,antiabrasion',
   'Outdoor · Montaña',
   'Softshell cortaviento con capucha ajustable, interior micropolar y refuerzos en los hombros.',
   109.00, 129.00, 4.9, 'Oferta -16%', 'oferta',
   '/assets/images/hombre/nex-33-softshell.jpg', 'L', 1),

  ('nex-34', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Polo Piqué Tech Club', 'hombre', 'camiseta', NULL,
   'Athleisure · Urbano',
   'Piqué técnico con elastano, cuello de punto y tratamiento antiolor para el día a día.',
   39.95, NULL, 4.6, 'Nuevo', 'nuevo',
   '/assets/images/athleisure/nex-34-polo-pique.jpg', 'M', 1),

  ('nex-35', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Pantalón Chino Tech Commuter', 'hombre', 'pantalon', 'dwr,bolsillos_zip',
   'Athleisure · Ciudad',
   'Corte chino con tejido elástico repelente al agua y bolsillo trasero con cremallera oculta.',
   64.90, NULL, 4.7, 'Tendencia', 'tendencia',
   '/assets/images/hombre/nex-12-jogger.webp', 'L', 1),

  ('nex-36', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Bomber Ligera Transit', 'hombre', 'chaqueta', NULL,
   'Athleisure · Casual',
   'Bomber acolchada ligera con cuello acanalado y forro de malla transpirable.',
   84.95, 99.95, 4.8, 'Oferta -15%', 'oferta',
   '/assets/images/product-nex-04.jpg', 'L', 1);

-- ----------------------------------------------------------------------------
--  7.2 ter Colección Mujer (página «Ropa Deportiva de Mujer», #/mujer)
--      nex-02 y nex-06 ya existían: se completan con los campos de filtro.
--      Fotos de producto en frontend/public/assets/images/mujer/.
-- ----------------------------------------------------------------------------
UPDATE products
   SET garment_type = 'compresion', features = 'compresion,cintura_alta',
       subtitle = 'Running · Compresión',
       description = 'Compresión graduada con cintura alta reforzada y bolsillo trasero para llaves o geles.'
 WHERE id = 'nex-02';

UPDATE products
   SET garment_type = 'top', features = 'compresion',
       subtitle = 'Running · Alto Impacto',
       description = 'Sujeción de alto impacto con espalda cruzada y copas extraíbles.'
 WHERE id = 'nex-06';

UPDATE products
   SET garment_type = 'sudadera', features = 'french_terry,oversize',
       subtitle = 'Athleisure · Casual Urbano',
       description = 'Felpa cepillada de gramaje alto con corte oversize, capucha amplia y bolsillo canguro.'
 WHERE id = 'nex-04';

INSERT INTO products
  (id, category_id, name, audience, garment_type, features, subtitle, description,
   price, original_price, rating, badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-37', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Top Deportivo Sculpt Core Support', 'mujer', 'top', 'compresion',
   'Fitness / Gym & Hiit',
   'Sujeción anatómica para alto impacto con tirantes dobles y tejido microventilado.',
   39.95, NULL, 4.8, 'Alto Soporte', 'soporte',
   '/assets/images/mujer/nex-37-top-sculpt-core.jpg', 'M', 1),

  ('nex-38', (SELECT id FROM categories WHERE slug = 'yoga'),
   'Leggings Compresión Sculpt Motion', 'mujer', 'compresion', 'compresion,squatproof,cintura_alta',
   'Yoga & Entrenamiento',
   'Cintura alta anatómica, tejido ultraelástico 4-way stretch no transparente.',
   49.90, 59.00, 4.9, 'Squat-Proof 360°', 'nuevo',
   '/assets/images/mujer/nex-38-leggings-sculpt-motion.jpg', 'M', 1),

  ('nex-39', (SELECT id FROM categories WHERE slug = 'running'),
   'Pullover Técnico Velocity Quarter-Zip', 'mujer', 'camiseta', 'dryfit,reflectante',
   'Running & Maratón',
   'Manga larga con abertura para pulgar, cremallera sellada y reflectantes 360°.',
   54.00, NULL, 4.7, 'Micro-Thermal', 'nuevo',
   '/assets/images/mujer/nex-39-pullover-velocity.jpg', 'M', 1),

  ('nex-40', (SELECT id FROM categories WHERE slug = 'yoga'),
   'Top Envolvente Seamless PureFlow', 'mujer', 'top', 'squatproof',
   'Yoga, Pilates & Barre',
   'Tejido acanalado ultrasuave, sujeción ligera y máxima libertad de movimiento.',
   34.50, NULL, 4.8, 'Tacto Segunda Piel', 'soporte',
   '/assets/images/mujer/nex-40-top-seamless-pureflow.jpg', 'S', 1),

  ('nex-41', (SELECT id FROM categories WHERE slug = 'running'),
   'Short Compresivo Doble Capa Motion', 'mujer', 'short', 'compresion,dryfit,reflectante',
   'Running & CrossFit',
   'Malla interior compresiva anti-roce con bolsillo para smartphone y detalles reflectantes.',
   36.00, 45.00, 4.7, '2-en-1 Integrado', 'oferta',
   '/assets/images/mujer/nex-41-short-doble-capa.jpg', 'M', 1),

  ('nex-42', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Chaqueta Cortavientos Alpine Shield', 'mujer', 'chaqueta', 'dwr',
   'Outdoor & Trail Trekking',
   'Membrana cortavientos ultraligera de 140 g con capucha ajustable y costuras selladas.',
   84.95, NULL, 4.9, 'Waterproof DWR', 'tecnico',
   '/assets/images/mujer/nex-42-chaqueta-alpine-shield.jpg', 'M', 1),

  ('nex-43', (SELECT id FROM categories WHERE slug = 'fitness'),
   'Top Racerback Ribbed Flow', 'mujer', 'top', 'dryfit',
   'Fitness · Entrenamiento',
   'Punto acanalado elástico con espalda nadadora y sujeción media para entrenos de fuerza.',
   32.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/mujer/nex-43-top-racerback-flow.jpg', 'S', 1),

  ('nex-44', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Short Biker Sculpt Contour', 'mujer', 'compresion', 'compresion,squatproof,cintura_alta',
   'CrossFit · WOD',
   'Biker de compresión con cintura alta, vivos de contraste y tejido opaco squat-proof.',
   34.95, 42.00, 4.8, 'Oferta -17%', 'oferta',
   '/assets/images/mujer/nex-44-biker-sculpt.jpg', 'M', 1),

  ('nex-45', (SELECT id FROM categories WHERE slug = 'running'),
   'Camiseta Tirantes Aero Run', 'mujer', 'camiseta', 'dryfit',
   'Running · Competición',
   'Espalda nadadora con microperforaciones láser y tejido DryFit de secado ultrarrápido.',
   31.95, NULL, 4.6, 'Técnico', 'tecnico',
   '/assets/images/mujer/nex-45-tirantes-aero-run.jpg', 'S', 1),

  ('nex-46', (SELECT id FROM categories WHERE slug = 'running'),
   'Mallas Running Night Pace', 'mujer', 'compresion', 'compresion,cintura_alta',
   'Running · Invierno',
   'Mallas largas con cintura alta, bolsillo lateral con cremallera y paneles de contraste.',
   54.95, 64.95, 4.8, 'Oferta -15%', 'oferta',
   '/assets/images/mujer/nex-46-mallas-night-pace.jpg', 'M', 1),

  ('nex-47', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Camiseta Fútbol Match Volta', 'mujer', 'camiseta', 'dryfit',
   'Fútbol · Partido',
   'Corte femenino con cuello en pico, paneles laterales transpirables y escudo termosellado.',
   44.95, NULL, 4.7, 'Oficial Match', 'nuevo',
   '/assets/images/mujer/nex-47-camiseta-futbol-volta.jpg', 'M', 1),

  ('nex-48', (SELECT id FROM categories WHERE slug = 'crossfit'),
   'Camiseta Tirantes WOD Heather', 'mujer', 'camiseta', 'dryfit',
   'CrossFit · Hiit',
   'Tejido jaspeado ligero con espalda abierta y costuras planas de contraste anti-roce.',
   30.95, NULL, 4.6, 'Tendencia', 'tendencia',
   '/assets/images/mujer/nex-48-tirantes-wod-heather.jpg', 'S', 1),

  ('nex-49', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Chaqueta Softshell Summit', 'mujer', 'chaqueta', 'dwr',
   'Outdoor · Montaña',
   'Softshell con capucha ajustable, refuerzos en los hombros y cremalleras impermeables.',
   99.95, 119.95, 4.9, 'Oferta -17%', 'oferta',
   '/assets/images/mujer/nex-49-softshell-summit.jpg', 'M', 1),

  ('nex-50', (SELECT id FROM categories WHERE slug = 'outdoor'),
   'Pantalón Trekking Stretch Trail', 'mujer', 'pantalon', 'dwr',
   'Outdoor · Trekking',
   'Tejido elástico repelente al agua con bolsillos cargo y bajo ajustable con cordón.',
   69.95, NULL, 4.7, 'Técnico', 'tecnico',
   '/assets/images/mujer/nex-50-pantalon-trekking.jpg', 'M', 1),

  ('nex-51', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Jogger Fleece Cloud', 'mujer', 'pantalon', 'french_terry',
   'Athleisure · Recuperación',
   'Felpa ultrasuave con cintura de canalé, cordón ajustable y puños elásticos.',
   49.95, NULL, 4.8, 'Tendencia', 'tendencia',
   '/assets/images/mujer/nex-51-jogger-fleece.jpg', 'M', 1),

  ('nex-52', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Camiseta Entreno Fútbol Half-Zip', 'mujer', 'camiseta', 'dryfit',
   'Fútbol · Entrenamiento',
   'Manga larga con media cremallera, mangas raglán de contraste y puños con orificio para el pulgar.',
   46.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/mujer/nex-52-futbol-half-zip.jpg', 'M', 1),

  ('nex-53', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Zip Hoodie Calm', 'mujer', 'sudadera', 'french_terry',
   'Athleisure · Casual',
   'Capucha y cremallera completa, interior cepillado y puños con orificio para el pulgar.',
   59.95, 69.95, 4.8, 'Oferta -14%', 'oferta',
   '/assets/images/mujer/nex-53-zip-hoodie.jpg', 'M', 1);

-- ----------------------------------------------------------------------------
--  7.2 quater Colección Fútbol (página «Ropa de Fútbol», #/futbol)
--      Hombre, mujer y unisex; incluye accesorios (botas, guantes y medias).
--      Fotos de producto en frontend/public/assets/images/futbol/.
-- ----------------------------------------------------------------------------
INSERT INTO products
  (id, category_id, name, audience, garment_type, features, subtitle, description,
   price, original_price, rating, badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-54', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Camiseta Match Pro Striker Home', 'hombre', 'camiseta', 'dryfit',
   'Fútbol · Torneo Oficial',
   'Estructura panal de abeja hiperventilada con costuras planas ergonómicas.',
   49.95, NULL, 4.8, 'Oficial Match', 'soporte',
   '/assets/images/futbol/nex-54-camiseta-match-striker.jpg', 'M', 1),

  ('nex-55', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Camiseta Match Pro Femenina Aethel', 'mujer', 'camiseta', 'dryfit',
   'Fútbol Femenino · Competición',
   'Patrón entallado ergonómico femenino con paneles de micromalla y cuello en V de gran ventilación.',
   49.95, NULL, 4.8, 'Tejido Transpirable', 'nuevo',
   '/assets/images/futbol/nex-55-camiseta-aethel-mujer.jpg', 'S', 1),

  ('nex-56', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Pantalón Chándal Training Pro Tapered', 'unisex', 'pantalon', NULL,
   'Fútbol · Entrenamiento',
   'Ajuste cónico con cremalleras técnicas en tobillos y bolsillos laterales termosellados.',
   44.90, NULL, 4.7, 'Fit Cónico Tobillo', 'tecnico',
   '/assets/images/futbol/nex-56-pantalon-training-tapered.jpg', 'M', 1),

  ('nex-57', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Botas de Fútbol Striker FG Pro', 'unisex', 'accesorio', NULL,
   'Fútbol · Calzado Alta Gama',
   'Empeine microtexturizado Ball-Control con tacos híbridos de aceleración y tracción reactiva.',
   119.95, NULL, 4.9, 'Nueva Generación FG', 'nuevo',
   '/assets/images/futbol/nex-57-botas-striker-fg.jpg', '42', 1),

  ('nex-58', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Guantes de Portero Pro Grip', 'unisex', 'accesorio', NULL,
   'Fútbol · Portero',
   'Palma de látex premium de 4 mm con zonas de flexión ergonómicas y cierre elástico de doble vuelta.',
   54.95, NULL, 4.7, 'Látex Contact Grip 4mm', 'tecnico',
   '/assets/images/futbol/nex-58-guantes-portero-grip.jpg', '9', 1),

  ('nex-59', (SELECT id FROM categories WHERE slug = 'futbol'),
   'Medias Técnicas Compresión Match', 'unisex', 'accesorio', 'compresion',
   'Fútbol · Equipación Oficial',
   'Compresión graduada con inserciones antideslizantes GripTech en planta y talón reforzado.',
   18.95, NULL, 4.6, 'Grip-Tech Compresión', 'tendencia',
   '/assets/images/futbol/nex-59-medias-compresion-match.jpg', 'M', 1);

-- ----------------------------------------------------------------------------
--  7.2 quinquies Colección Running (página «Ropa de Running», #/running)
--      Prendas de hombre y mujer y accesorios unisex (zapatillas, reloj...).
--      Fotos de producto en frontend/public/assets/images/running/.
-- ----------------------------------------------------------------------------
INSERT INTO products
  (id, category_id, name, audience, garment_type, features, subtitle, description,
   price, original_price, rating, badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-60', (SELECT id FROM categories WHERE slug = 'running'),
   'Perneras de Compresión Calf Boost', 'unisex', 'compresion', 'compresion',
   'Running · Recuperación',
   'Compresión graduada en gemelo que reduce la vibración muscular y acelera la recuperación.',
   24.95, NULL, 4.7, 'Compresión Activa', 'tecnico',
   '/assets/images/running/nex-60-perneras-compresion.jpg', 'M', 1),

  ('nex-61', (SELECT id FROM categories WHERE slug = 'running'),
   'Camiseta Térmica Half-Zip Night Run', 'mujer', 'camiseta', 'dryfit,reflectante',
   'Running · Invierno',
   'Manga larga térmica con media cremallera, orificio para el pulgar y vivos reflectantes 360°.',
   49.95, NULL, 4.8, 'Micro-Thermal', 'nuevo',
   '/assets/images/running/nex-61-half-zip-night-run.jpg', 'S', 1),

  ('nex-62', (SELECT id FROM categories WHERE slug = 'running'),
   'Camiseta Tirantes Pace Mesh', 'hombre', 'camiseta', 'dryfit',
   'Running · Competición',
   'Singlet ultraligero con malla perforada en el pecho y paneles laterales de contraste.',
   32.95, NULL, 4.7, 'Ultraligera', 'tendencia',
   '/assets/images/running/nex-62-tirantes-pace-mesh.jpg', 'M', 1),

  ('nex-63', (SELECT id FROM categories WHERE slug = 'running'),
   'Short 2-en-1 Trail Phone Pocket', 'hombre', 'short', 'compresion',
   'Running & Trail',
   'Short exterior ligero con malla interior compresiva y bolsillo lateral para el móvil.',
   42.95, 49.95, 4.8, 'Oferta -14%', 'oferta',
   '/assets/images/running/nex-63-short-2en1-trail.jpg', 'M', 1),

  ('nex-64', (SELECT id FROM categories WHERE slug = 'running'),
   'Short Split Velocity Femenino', 'mujer', 'short', 'dryfit',
   'Running · Ritmo',
   'Corte split con aberturas laterales, braga interior y bolsillo trasero con cremallera.',
   32.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/running/nex-64-short-split-femenino.jpg', 'S', 1),

  ('nex-65', (SELECT id FROM categories WHERE slug = 'running'),
   'Sujetador Deportivo Run Zip Front', 'mujer', 'top', 'compresion',
   'Running · Alto Impacto',
   'Sujeción de alto impacto con cremallera frontal, espalda nadadora y banda elástica ancha.',
   44.95, NULL, 4.9, 'Alto Soporte', 'soporte',
   '/assets/images/running/nex-65-sujetador-zip-front.jpg', 'S', 1),

  ('nex-66', (SELECT id FROM categories WHERE slug = 'running'),
   'Pack 3 Calcetines Técnicos Run', 'unisex', 'accesorio', 'dryfit',
   'Running · Accesorios',
   'Tres pares con refuerzo en talón y puntera, zona de ventilación y arco de sujeción.',
   19.95, NULL, 4.6, 'Pack x3', 'tendencia',
   '/assets/images/running/nex-66-pack-calcetines.jpg', '39-42', 1),

  ('nex-67', (SELECT id FROM categories WHERE slug = 'running'),
   'Brazalete Porta Móvil Touch', 'unisex', 'accesorio', 'reflectante',
   'Running · Accesorios',
   'Funda táctil para smartphones de hasta 6,7 pulgadas con cierre ajustable y detalles reflectantes.',
   22.95, NULL, 4.5, 'Pantalla Táctil', 'tecnico',
   '/assets/images/running/nex-67-brazalete-movil.jpg', 'Única', 1),

  ('nex-68', (SELECT id FROM categories WHERE slug = 'running'),
   'Soft Flask Hidratación 500 ml', 'unisex', 'accesorio', NULL,
   'Running · Hidratación',
   'Bidón flexible sin BPA con válvula de mordida que se pliega al vaciarse.',
   16.95, NULL, 4.6, 'Sin BPA', 'tendencia',
   '/assets/images/running/nex-68-soft-flask-500.jpg', 'Única', 1),

  ('nex-69', (SELECT id FROM categories WHERE slug = 'running'),
   'Visera Ultraligera Aero Run', 'unisex', 'accesorio', 'dryfit',
   'Running · Accesorios',
   'Visera perforada de secado rápido con banda absorbente y cierre ajustable.',
   24.95, NULL, 4.7, 'Ultraligera', 'nuevo',
   '/assets/images/running/nex-69-visera-aero.jpg', 'Única', 1),

  ('nex-70', (SELECT id FROM categories WHERE slug = 'running'),
   'Linterna Pectoral RunLight 500', 'unisex', 'accesorio', 'reflectante',
   'Running · Nocturno',
   'Luz frontal de 500 lúmenes con arnés pectoral sin rebote y cintas reflectantes.',
   59.95, NULL, 4.8, '500 Lúmenes', 'tecnico',
   '/assets/images/running/nex-70-linterna-pectoral.jpg', 'Única', 1),

  ('nex-71', (SELECT id FROM categories WHERE slug = 'running'),
   'Gafas Running Photochromic Shield', 'unisex', 'accesorio', NULL,
   'Running · Accesorios',
   'Lente envolvente fotocromática con montura ultraligera y patillas antideslizantes.',
   79.95, 94.95, 4.7, 'Oferta -16%', 'oferta',
   '/assets/images/running/nex-71-gafas-photochromic.jpg', 'Única', 1),

  ('nex-72', (SELECT id FROM categories WHERE slug = 'running'),
   'Reloj GPS Marathon Pro Pace', 'unisex', 'accesorio', NULL,
   'Running · Electrónica',
   'Métricas precisas de ritmo, cadencia y VO2 Max, GPS multibanda y batería de larga duración.',
   189.00, NULL, 4.9, 'GPS & Pulso Óptico', 'soporte',
   '/assets/images/running/nex-72-reloj-gps.jpg', '46mm', 1),

  ('nex-73', (SELECT id FROM categories WHERE slug = 'running'),
   'Zapatillas NEXFIT AeroSpeed', 'unisex', 'accesorio', NULL,
   'Running · Maratón & Asfalto',
   'Suela amortiguada con retorno de energía, malla técnica transpirable y reflectantes.',
   139.95, 165.00, 4.9, 'Oferta -15%', 'oferta',
   '/assets/images/running/nex-73-zapatillas-aerospeed.jpg', '42', 1),

  ('nex-74', (SELECT id FROM categories WHERE slug = 'running'),
   'Auriculares Conducción Ósea Aero', 'unisex', 'accesorio', NULL,
   'Running · Electrónica',
   'Conducción ósea con oído libre para oír el tráfico, resistentes al sudor y 8 h de batería.',
   129.95, NULL, 4.7, 'Oído Libre', 'nuevo',
   '/assets/images/running/nex-74-auriculares-oseos.jpg', 'Única', 1),

  ('nex-75', (SELECT id FROM categories WHERE slug = 'running'),
   'Cinturón Riñonera Hidratación Trail', 'unisex', 'accesorio', 'reflectante',
   'Running & Trail',
   'Bolsillo expandible para móvil de 6,7 pulgadas, bidón plano ergonómico y gomas para bastones.',
   29.90, NULL, 4.8, 'Zero-Bounce', 'tecnico',
   '/assets/images/running/nex-75-rinonera-hidratacion.jpg', 'M', 1),

  ('nex-76', (SELECT id FROM categories WHERE slug = 'running'),
   'Bastones Trail Carbon Fold', 'unisex', 'accesorio', NULL,
   'Running & Trail',
   'Bastones plegables de carbono con empuñadura de espuma y puntas de tungsteno.',
   89.95, NULL, 4.8, 'Carbono', 'tecnico',
   '/assets/images/running/nex-76-bastones-trail.jpg', '120 cm', 1);

-- ----------------------------------------------------------------------------
--  7.2 sexies Colección Athleisure (página «Ropa Casual & Athleisure», #/athleisure)
--      Prendas de hombre, mujer y unisex y una bolsa de accesorio.
--      Fotos de producto en frontend/public/assets/images/athleisure/.
-- ----------------------------------------------------------------------------
INSERT INTO products
  (id, category_id, name, audience, garment_type, features, subtitle, description,
   price, original_price, rating, badge_label, badge_tone, image_url, default_size, is_active)
VALUES
  ('nex-77', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Pantalón Jogger Tailored Tech Knit', 'hombre', 'pantalon', 'bolsillos_zip',
   'Athleisure & Diario',
   'Patrón estilizado con bolsillos termosellados con cremallera y tobilleras elásticas compactas.',
   49.95, 59.00, 4.8, 'Oferta -15%', 'oferta',
   '/assets/images/athleisure/nex-77-jogger-tailored.jpg', 'M', 1),

  ('nex-78', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Chaqueta Zip Urbana TechKnit Essential', 'hombre', 'chaqueta', 'bolsillos_zip',
   'Athleisure & Capas',
   'Estructura híbrida cortaviento y aislante con cremallera central bidireccional termosellada.',
   64.00, NULL, 4.7, 'All-Weather Casual', 'tecnico',
   '/assets/images/athleisure/nex-78-chaqueta-techknit.jpg', 'M', 1),

  ('nex-79', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Camiseta Minimal Boxy Heavy Cotton', 'hombre', 'camiseta', 'oversize,antipilling',
   'Athleisure & Essential',
   'Algodón pesado premium de 280 g/m² con corte boxy atlético y micro-bordado frontal.',
   32.00, NULL, 4.7, 'Minimal Boxy', 'tecnico',
   '/assets/images/athleisure/nex-79-camiseta-boxy.jpg', 'M', 1),

  ('nex-80', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Bermuda Chino Tech Stretch', 'hombre', 'short', 'bolsillos_zip',
   'Athleisure · Verano Urbano',
   'Chino elástico de secado rápido con cintura plana y bolsillo trasero con cremallera.',
   44.95, NULL, 4.6, 'Tendencia', 'tendencia',
   '/assets/images/athleisure/nex-80-bermuda-chino.jpg', 'M', 1),

  ('nex-81', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Crewneck Raglan Heather', 'hombre', 'sudadera', 'french_terry,antipilling',
   'Athleisure & Relax',
   'Felpa jaspeada con mangas raglán, puños de canalé y tratamiento anti-pilling.',
   49.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/athleisure/nex-81-crewneck-raglan.jpg', 'L', 1),

  ('nex-82', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Hoodie Oversize PureRelax', 'unisex', 'sudadera', 'french_terry,oversize',
   'Athleisure · Unisex',
   'Tejido fleece afelpado de 420 g/m² con caída natural y capucha de doble forro ergonómico.',
   59.95, NULL, 4.9, 'Premium Heavyweight', 'tecnico',
   '/assets/images/athleisure/nex-82-hoodie-pure-relax.jpg', 'M', 1),

  ('nex-83', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Chaleco Sherpa Trail Fleece', 'unisex', 'chaqueta', 'bolsillos_zip',
   'Athleisure & Capas',
   'Sherpa mullido con ribetes de contraste y bolsillo de pecho con cremallera.',
   69.95, NULL, 4.8, 'Tendencia', 'tendencia',
   '/assets/images/athleisure/nex-83-chaleco-sherpa.jpg', 'M', 1),

  ('nex-84', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Bolsa Gym Tote Commuter', 'unisex', 'accesorio', NULL,
   'Athleisure · Accesorios',
   'Tote impermeable con compartimento para portátil, bolsillo para zapatillas y bandolera.',
   54.95, NULL, 4.7, 'Gym to Office', 'nuevo',
   '/assets/images/athleisure/nex-84-bolsa-tote.jpg', 'Única', 1),

  ('nex-85', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Pantalón Wide-Leg Sweatpants Soft Oat', 'mujer', 'pantalon', 'french_terry',
   'Athleisure & Relax',
   'Tejido tech fleece suave en tono avena con cintura elástica ajustable con cordón y pernera ancha.',
   52.00, NULL, 4.8, 'Confort Relajado', 'nuevo',
   '/assets/images/athleisure/nex-85-wide-leg-oat.jpg', 'S', 1),

  ('nex-86', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Sudadera Cropped Crewneck Melocotón', 'mujer', 'sudadera', 'french_terry,oversize',
   'Athleisure & Relax',
   'Corte recortado con hombros caídos y tacto melocotón cepillado ultra suave para el día a día.',
   42.90, NULL, 4.8, 'Soft-Touch', 'soporte',
   '/assets/images/athleisure/nex-86-cropped-melocoton.jpg', 'S', 1),

  ('nex-87', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Top Canalé Cropped Everyday', 'mujer', 'top', NULL,
   'Athleisure · Básicos',
   'Punto canalé elástico de doble capa, cuello redondo y largo cropped para combinar.',
   29.95, NULL, 4.6, 'Tendencia', 'tendencia',
   '/assets/images/athleisure/nex-87-top-canale.jpg', 'S', 1),

  ('nex-88', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Chaqueta Polar Zip Rose Cloud', 'mujer', 'chaqueta', 'antipilling',
   'Athleisure & Capas',
   'Polar micro-fleece con cuello alto, bolsillos laterales y tratamiento anti-pilling.',
   59.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/athleisure/nex-88-polar-rose.jpg', 'S', 1),

  ('nex-89', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Vestido Midi Canalé Everyday', 'mujer', 'vestido', NULL,
   'Athleisure · Ciudad',
   'Vestido midi de punto canalé con tirante ancho, abertura lateral y caída fluida.',
   44.95, NULL, 4.7, 'Nuevo', 'nuevo',
   '/assets/images/athleisure/nex-89-vestido-midi.jpg', 'S', 1),

  ('nex-90', (SELECT id FROM categories WHERE slug = 'athleisure'),
   'Chaqueta Bomber Knit Ivory', 'mujer', 'chaqueta', 'bolsillos_zip',
   'Athleisure & Capas',
   'Bomber de punto técnico con ribetes de canalé y bolsillos laterales con cremallera.',
   64.95, 74.95, 4.8, 'Oferta -13%', 'oferta',
   '/assets/images/athleisure/nex-90-bomber-ivory.jpg', 'S', 1);

-- ----------------------------------------------------------------------------
--  7.3 Tallas y stock
-- ----------------------------------------------------------------------------
INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES
  ('nex-01', 'S',  12, 1), ('nex-01', 'M',  25, 2), ('nex-01', 'L',  18, 3), ('nex-01', 'XL',  6, 4),
  ('nex-02', 'XS',  8, 1), ('nex-02', 'S',  20, 2), ('nex-02', 'M',  14, 3), ('nex-02', 'L',   5, 4),
  ('nex-03', 'S',   6, 1), ('nex-03', 'M',  10, 2), ('nex-03', 'L',  16, 3), ('nex-03', 'XL',  9, 4),
  ('nex-04', 'S',  15, 1), ('nex-04', 'M',  22, 2), ('nex-04', 'L',  12, 3), ('nex-04', 'XL',  7, 4),
  ('nex-05', 'S',   9, 1), ('nex-05', 'M',  14, 2), ('nex-05', 'L',  20, 3), ('nex-05', 'XL', 11, 4),
  ('nex-06', 'XS', 10, 1), ('nex-06', 'S',  18, 2), ('nex-06', 'M',  12, 3), ('nex-06', 'L',   4, 4),
  -- Colección Hombre
  ('nex-07', 'S',  10, 1), ('nex-07', 'M',  24, 2), ('nex-07', 'L',  18, 3), ('nex-07', 'XL',  8, 4),
  ('nex-08', 'S',   6, 1), ('nex-08', 'M',  12, 2), ('nex-08', 'L',  15, 3), ('nex-08', 'XL',  9, 4), ('nex-08', 'XXL', 4, 5),
  ('nex-09', 'S',   7, 1), ('nex-09', 'M',  11, 2), ('nex-09', 'L',  14, 3), ('nex-09', 'XL',  6, 4),
  ('nex-10', 'M',   9, 1), ('nex-10', 'L',  13, 2), ('nex-10', 'XL',  8, 3), ('nex-10', 'XXL', 3, 4),
  ('nex-11', 'S',  12, 1), ('nex-11', 'M',  20, 2), ('nex-11', 'L',  17, 3), ('nex-11', 'XL',  7, 4),
  ('nex-12', 'S',   8, 1), ('nex-12', 'M',  16, 2), ('nex-12', 'L',  14, 3), ('nex-12', 'XL',  9, 4),
  ('nex-13', 'S',  14, 1), ('nex-13', 'M',  30, 2), ('nex-13', 'L',  26, 3), ('nex-13', 'XL', 12, 4), ('nex-13', 'XXL', 6, 5),
  ('nex-14', 'S',   5, 1), ('nex-14', 'M',  12, 2), ('nex-14', 'L',  10, 3), ('nex-14', 'XL',  4, 4),
  ('nex-15', 'M',  10, 1), ('nex-15', 'L',  12, 2), ('nex-15', 'XL',  7, 3), ('nex-15', 'XXL', 3, 4),
  ('nex-16', 'M',   6, 1), ('nex-16', 'L',   9, 2), ('nex-16', 'XL',  5, 3), ('nex-16', 'XXL', 2, 4),
  ('nex-17', 'S',   9, 1), ('nex-17', 'M',  15, 2), ('nex-17', 'L',  18, 3), ('nex-17', 'XL', 10, 4),
  ('nex-18', 'S',   6, 1), ('nex-18', 'M',  11, 2), ('nex-18', 'L',   9, 3), ('nex-18', 'XL',  5, 4),
  ('nex-19', 'S',   14, 1), ('nex-19', 'M',   26, 2), ('nex-19', 'L',   20, 3), ('nex-19', 'XL',  10, 4), ('nex-19', 'XXL',  5, 5),
  ('nex-20', 'S',   12, 1), ('nex-20', 'M',   22, 2), ('nex-20', 'L',   18, 3), ('nex-20', 'XL',   8, 4),
  ('nex-21', 'M',    8, 1), ('nex-21', 'L',   11, 2), ('nex-21', 'XL',   7, 3), ('nex-21', 'XXL',  3, 4),
  ('nex-22', 'S',   10, 1), ('nex-22', 'M',   18, 2), ('nex-22', 'L',   16, 3), ('nex-22', 'XL',   9, 4),
  ('nex-23', 'S',    7, 1), ('nex-23', 'M',   15, 2), ('nex-23', 'L',   14, 3), ('nex-23', 'XL',   8, 4), ('nex-23', 'XXL',  4, 5),
  ('nex-24', 'S',    9, 1), ('nex-24', 'M',   21, 2), ('nex-24', 'L',   19, 3), ('nex-24', 'XL',  11, 4), ('nex-24', 'XXL',  5, 5),
  ('nex-25', 'S',   11, 1), ('nex-25', 'M',   24, 2), ('nex-25', 'L',   22, 3), ('nex-25', 'XL',  12, 4),
  ('nex-26', 'S',    8, 1), ('nex-26', 'M',   17, 2), ('nex-26', 'L',   15, 3), ('nex-26', 'XL',   9, 4),
  ('nex-27', 'S',    6, 1), ('nex-27', 'M',   13, 2), ('nex-27', 'L',   12, 3), ('nex-27', 'XL',   7, 4), ('nex-27', 'XXL',  3, 5),
  ('nex-28', 'S',   13, 1), ('nex-28', 'M',   22, 2), ('nex-28', 'L',   17, 3), ('nex-28', 'XL',   8, 4),
  ('nex-29', 'S',    5, 1), ('nex-29', 'M',   10, 2), ('nex-29', 'L',   12, 3), ('nex-29', 'XL',   6, 4),
  ('nex-30', 'S',    9, 1), ('nex-30', 'M',   16, 2), ('nex-30', 'L',   13, 3), ('nex-30', 'XL',   6, 4),
  ('nex-31', 'S',    6, 1), ('nex-31', 'M',   12, 2), ('nex-31', 'L',   11, 3), ('nex-31', 'XL',   6, 4),
  ('nex-32', 'M',    9, 1), ('nex-32', 'L',   12, 2), ('nex-32', 'XL',   8, 3), ('nex-32', 'XXL',  4, 4),
  ('nex-33', 'M',    7, 1), ('nex-33', 'L',   10, 2), ('nex-33', 'XL',   6, 3), ('nex-33', 'XXL',  3, 4),
  ('nex-34', 'S',   10, 1), ('nex-34', 'M',   19, 2), ('nex-34', 'L',   17, 3), ('nex-34', 'XL',   9, 4), ('nex-34', 'XXL',  4, 5),
  ('nex-35', 'S',    7, 1), ('nex-35', 'M',   14, 2), ('nex-35', 'L',   13, 3), ('nex-35', 'XL',   7, 4),
  ('nex-36', 'S',    6, 1), ('nex-36', 'M',   12, 2), ('nex-36', 'L',   12, 3), ('nex-36', 'XL',   6, 4),
  -- Colección Mujer
  ('nex-37', 'XS',  10, 1), ('nex-37', 'S',   18, 2), ('nex-37', 'M',   22, 3), ('nex-37', 'L',   12, 4),
  ('nex-38', 'XS',   9, 1), ('nex-38', 'S',   20, 2), ('nex-38', 'M',   24, 3), ('nex-38', 'L',   14, 4), ('nex-38', 'XL',   6, 5),
  ('nex-39', 'XS',   6, 1), ('nex-39', 'S',   14, 2), ('nex-39', 'M',   16, 3), ('nex-39', 'L',    9, 4),
  ('nex-40', 'XS',  11, 1), ('nex-40', 'S',   19, 2), ('nex-40', 'M',   17, 3), ('nex-40', 'L',    8, 4),
  ('nex-41', 'XS',   8, 1), ('nex-41', 'S',   15, 2), ('nex-41', 'M',   18, 3), ('nex-41', 'L',   10, 4),
  ('nex-42', 'S',    7, 1), ('nex-42', 'M',   12, 2), ('nex-42', 'L',   10, 3), ('nex-42', 'XL',   5, 4),
  ('nex-43', 'XS',   9, 1), ('nex-43', 'S',   17, 2), ('nex-43', 'M',   19, 3), ('nex-43', 'L',   10, 4),
  ('nex-44', 'XS',   7, 1), ('nex-44', 'S',   15, 2), ('nex-44', 'M',   18, 3), ('nex-44', 'L',   12, 4), ('nex-44', 'XL',   5, 5),
  ('nex-45', 'XS',   9, 1), ('nex-45', 'S',   17, 2), ('nex-45', 'M',   19, 3), ('nex-45', 'L',   10, 4),
  ('nex-46', 'XS',   7, 1), ('nex-46', 'S',   15, 2), ('nex-46', 'M',   18, 3), ('nex-46', 'L',   12, 4), ('nex-46', 'XL',   5, 5),
  ('nex-47', 'XS',   7, 1), ('nex-47', 'S',   15, 2), ('nex-47', 'M',   18, 3), ('nex-47', 'L',   12, 4), ('nex-47', 'XL',   5, 5),
  ('nex-48', 'XS',   9, 1), ('nex-48', 'S',   17, 2), ('nex-48', 'M',   19, 3), ('nex-48', 'L',   10, 4),
  ('nex-49', 'S',    6, 1), ('nex-49', 'M',   11, 2), ('nex-49', 'L',    9, 3), ('nex-49', 'XL',   4, 4),
  ('nex-50', 'XS',   7, 1), ('nex-50', 'S',   15, 2), ('nex-50', 'M',   18, 3), ('nex-50', 'L',   12, 4), ('nex-50', 'XL',   5, 5),
  ('nex-51', 'XS',   7, 1), ('nex-51', 'S',   15, 2), ('nex-51', 'M',   18, 3), ('nex-51', 'L',   12, 4), ('nex-51', 'XL',   5, 5),
  ('nex-52', 'XS',   9, 1), ('nex-52', 'S',   17, 2), ('nex-52', 'M',   19, 3), ('nex-52', 'L',   10, 4),
  ('nex-53', 'XS',   7, 1), ('nex-53', 'S',   15, 2), ('nex-53', 'M',   18, 3), ('nex-53', 'L',   12, 4), ('nex-53', 'XL',   5, 5),
  -- Colección Fútbol
  ('nex-54', 'S',   12, 1), ('nex-54', 'M',   24, 2), ('nex-54', 'L',   20, 3), ('nex-54', 'XL',   9, 4),
  ('nex-55', 'XS',  10, 1), ('nex-55', 'S',   18, 2), ('nex-55', 'M',   16, 3), ('nex-55', 'L',    8, 4),
  ('nex-56', 'S',    9, 1), ('nex-56', 'M',   18, 2), ('nex-56', 'L',   16, 3), ('nex-56', 'XL',   8, 4), ('nex-56', 'XXL',  4, 5),
  ('nex-57', '40',   6, 1), ('nex-57', '42',  10, 2), ('nex-57', '43',   9, 3), ('nex-57', '44',   5, 4),
  ('nex-58', '8',    7, 1), ('nex-58', '9',   11, 2), ('nex-58', '10',   9, 3), ('nex-58', '11',   4, 4),
  ('nex-59', 'S',   20, 1), ('nex-59', 'M',   30, 2), ('nex-59', 'L',   22, 3),
  -- Colección Running
  ('nex-60', 'S',   14, 1), ('nex-60', 'M',   22, 2), ('nex-60', 'L',   16, 3),
  ('nex-61', 'XS',   8, 1), ('nex-61', 'S',   16, 2), ('nex-61', 'M',   18, 3), ('nex-61', 'L',   10, 4),
  ('nex-62', 'S',   10, 1), ('nex-62', 'M',   20, 2), ('nex-62', 'L',   18, 3), ('nex-62', 'XL',   8, 4),
  ('nex-63', 'S',    9, 1), ('nex-63', 'M',   17, 2), ('nex-63', 'L',   15, 3), ('nex-63', 'XL',   7, 4), ('nex-63', 'XXL',  3, 5),
  ('nex-64', 'XS',  10, 1), ('nex-64', 'S',   18, 2), ('nex-64', 'M',   16, 3), ('nex-64', 'L',    8, 4),
  ('nex-65', 'XS',   8, 1), ('nex-65', 'S',   16, 2), ('nex-65', 'M',   17, 3), ('nex-65', 'L',    9, 4),
  ('nex-66', '35-38', 20, 1), ('nex-66', '39-42', 30, 2), ('nex-66', '43-46', 20, 3),
  ('nex-67', 'Única', 40, 1),
  ('nex-68', 'Única', 40, 1),
  ('nex-69', 'Única', 40, 1),
  ('nex-70', 'Única', 40, 1),
  ('nex-71', 'Única', 40, 1),
  ('nex-72', '42mm',  8, 1), ('nex-72', '46mm', 10, 2),
  ('nex-73', '40',   6, 1), ('nex-73', '41',   8, 2), ('nex-73', '42',  10, 3), ('nex-73', '43',   8, 4), ('nex-73', '44',   5, 5),
  ('nex-74', 'Única', 40, 1),
  ('nex-75', 'S',   12, 1), ('nex-75', 'M',   20, 2), ('nex-75', 'L',   12, 3),
  ('nex-76', '110 cm',  6, 1), ('nex-76', '120 cm', 10, 2), ('nex-76', '130 cm',  6, 3),
  -- Colección Athleisure
  ('nex-77', 'S',    9, 1), ('nex-77', 'M',   18, 2), ('nex-77', 'L',   16, 3), ('nex-77', 'XL',   9, 4), ('nex-77', 'XXL',  4, 5),
  ('nex-78', 'S',    9, 1), ('nex-78', 'M',   18, 2), ('nex-78', 'L',   16, 3), ('nex-78', 'XL',   9, 4), ('nex-78', 'XXL',  4, 5),
  ('nex-79', 'S',    9, 1), ('nex-79', 'M',   18, 2), ('nex-79', 'L',   16, 3), ('nex-79', 'XL',   9, 4), ('nex-79', 'XXL',  4, 5),
  ('nex-80', 'S',   10, 1), ('nex-80', 'M',   20, 2), ('nex-80', 'L',   17, 3), ('nex-80', 'XL',   8, 4),
  ('nex-81', 'S',    9, 1), ('nex-81', 'M',   18, 2), ('nex-81', 'L',   16, 3), ('nex-81', 'XL',   9, 4), ('nex-81', 'XXL',  4, 5),
  ('nex-82', 'XS',   8, 1), ('nex-82', 'S',   15, 2), ('nex-82', 'M',   18, 3), ('nex-82', 'L',   12, 4), ('nex-82', 'XL',   5, 5),
  ('nex-83', 'XS',   8, 1), ('nex-83', 'S',   15, 2), ('nex-83', 'M',   18, 3), ('nex-83', 'L',   12, 4), ('nex-83', 'XL',   5, 5),
  ('nex-84', 'Única', 30, 1),
  ('nex-85', 'XS',   9, 1), ('nex-85', 'S',   17, 2), ('nex-85', 'M',   18, 3), ('nex-85', 'L',    9, 4),
  ('nex-86', 'XS',   9, 1), ('nex-86', 'S',   17, 2), ('nex-86', 'M',   18, 3), ('nex-86', 'L',    9, 4),
  ('nex-87', 'XS',   9, 1), ('nex-87', 'S',   17, 2), ('nex-87', 'M',   18, 3), ('nex-87', 'L',    9, 4),
  ('nex-88', 'XS',   9, 1), ('nex-88', 'S',   17, 2), ('nex-88', 'M',   18, 3), ('nex-88', 'L',    9, 4),
  ('nex-89', 'XS',   9, 1), ('nex-89', 'S',   17, 2), ('nex-89', 'M',   18, 3), ('nex-89', 'L',    9, 4),
  ('nex-90', 'XS',   9, 1), ('nex-90', 'S',   17, 2), ('nex-90', 'M',   18, 3), ('nex-90', 'L',    9, 4);

-- ----------------------------------------------------------------------------
--  7.4 Colores (has_border solo en los tonos claros)
-- ----------------------------------------------------------------------------
INSERT INTO product_colors (product_id, color_hex, color_name, has_border, sort_order) VALUES
  ('nex-01', '#111827', 'Negro',        0, 1),
  ('nex-01', '#FF5A1F', 'Naranja NEXFIT', 0, 2),
  ('nex-01', '#2563EB', 'Azul',         0, 3),

  ('nex-02', '#004B71', 'Azul petróleo', 0, 1),
  ('nex-02', '#111827', 'Negro',         0, 2),
  ('nex-02', '#9E1B32', 'Burdeos',       0, 3),

  ('nex-03', '#2563EB', 'Azul',  0, 1),
  ('nex-03', '#111827', 'Negro', 0, 2),

  ('nex-04', '#E5E0D8', 'Arena',      1, 1),
  ('nex-04', '#111827', 'Negro',      0, 2),
  ('nex-04', '#64748B', 'Gris',       0, 3),

  ('nex-05', '#111827', 'Negro',        0, 1),
  ('nex-05', '#374151', 'Gris oscuro',  0, 2),
  ('nex-05', '#1E3A8A', 'Azul marino',  0, 3),

  ('nex-06', '#AE3200', 'Terracota', 0, 1),
  ('nex-06', '#111827', 'Negro',     0, 2),
  ('nex-06', '#FFFFFF', 'Blanco',    1, 3),

  -- Colección Hombre (paleta del filtro: negro, grafito, azul, naranja, verde)
  ('nex-07', '#1E293B', 'Azul noche',     0, 1),
  ('nex-07', '#FF5A1F', 'Naranja NEXFIT', 0, 2),

  ('nex-08', '#374151', 'Grafito', 0, 1),
  ('nex-08', '#111827', 'Negro',   0, 2),

  ('nex-09', '#2563EB', 'Azul',  0, 1),
  ('nex-09', '#111827', 'Negro', 0, 2),

  ('nex-10', '#4B5D3A', 'Verde oliva', 0, 1),
  ('nex-10', '#111827', 'Negro',       0, 2),

  ('nex-11', '#111827', 'Negro',          0, 1),
  ('nex-11', '#FF5A1F', 'Naranja NEXFIT', 0, 2),

  ('nex-12', '#111827', 'Negro',   0, 1),
  ('nex-12', '#374151', 'Grafito', 0, 2),

  ('nex-13', '#111827', 'Negro',   0, 1),
  ('nex-13', '#2563EB', 'Azul',    0, 2),
  ('nex-13', '#FFFFFF', 'Blanco',  1, 3),

  ('nex-14', '#1E293B', 'Azul noche', 0, 1),
  ('nex-14', '#111827', 'Negro',      0, 2),

  ('nex-15', '#111827', 'Negro',          0, 1),
  ('nex-15', '#FF5A1F', 'Naranja NEXFIT', 0, 2),

  ('nex-16', '#FF5A1F', 'Naranja NEXFIT', 0, 1),
  ('nex-16', '#4B5D3A', 'Verde oliva',    0, 2),
  ('nex-16', '#111827', 'Negro',          0, 3),

  ('nex-17', '#374151', 'Grafito', 0, 1),
  ('nex-17', '#4B5D3A', 'Verde oliva', 0, 2),

  ('nex-18', '#111827', 'Negro', 0, 1),
  ('nex-18', '#2563EB', 'Azul',  0, 2),

  ('nex-19', '#1E293B', 'Azul noche',    0, 1),
  ('nex-19', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-20', '#1E293B', 'Azul noche',    0, 1),
  ('nex-20', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-21', '#1E293B', 'Azul noche',    0, 1),
  ('nex-21', '#111827', 'Negro',         0, 2),

  ('nex-22', '#374151', 'Grafito',       0, 1),
  ('nex-22', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-23', '#111827', 'Negro',         0, 1),
  ('nex-23', '#4B5D3A', 'Verde oliva',   0, 2),

  ('nex-24', '#111827', 'Negro',         0, 1),
  ('nex-24', '#374151', 'Grafito',       0, 2),

  ('nex-25', '#374151', 'Grafito',       0, 1),
  ('nex-25', '#111827', 'Negro',         0, 2),

  ('nex-26', '#2563EB', 'Azul',          0, 1),
  ('nex-26', '#111827', 'Negro',         0, 2),

  ('nex-27', '#374151', 'Grafito',       0, 1),
  ('nex-27', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-28', '#2563EB', 'Azul',          0, 1),
  ('nex-28', '#111827', 'Negro',         0, 2),

  ('nex-29', '#111827', 'Negro',         0, 1),
  ('nex-29', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-30', '#374151', 'Grafito',       0, 1),
  ('nex-30', '#111827', 'Negro',         0, 2),

  ('nex-31', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-31', '#374151', 'Grafito',       0, 2),

  ('nex-32', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-32', '#111827', 'Negro',         0, 2),
  ('nex-32', '#374151', 'Grafito',       0, 3),

  ('nex-33', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-33', '#111827', 'Negro',         0, 2),

  ('nex-34', '#1E293B', 'Azul noche',    0, 1),
  ('nex-34', '#FFFFFF', 'Blanco',        1, 2),
  ('nex-34', '#111827', 'Negro',         0, 3),

  ('nex-35', '#374151', 'Grafito',       0, 1),
  ('nex-35', '#111827', 'Negro',         0, 2),
  ('nex-35', '#1E293B', 'Azul noche',    0, 3),

  ('nex-36', '#111827', 'Negro',         0, 1),
  ('nex-36', '#4B5D3A', 'Verde oliva',   0, 2),

  -- Colección Mujer
  ('nex-37', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-37', '#111827', 'Negro',         0, 2),

  ('nex-38', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-38', '#111827', 'Negro',         0, 2),

  ('nex-39', '#2563EB', 'Azul',          0, 1),
  ('nex-39', '#111827', 'Negro',         0, 2),

  ('nex-40', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-40', '#111827', 'Negro',         0, 2),

  ('nex-41', '#111827', 'Negro',         0, 1),
  ('nex-41', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-42', '#AE3200', 'Terracota',     0, 1),
  ('nex-42', '#4B5D3A', 'Verde oliva',   0, 2),

  ('nex-43', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-43', '#111827', 'Negro',         0, 2),

  ('nex-44', '#374151', 'Grafito',       0, 1),
  ('nex-44', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-45', '#2563EB', 'Azul',          0, 1),
  ('nex-45', '#111827', 'Negro',         0, 2),

  ('nex-46', '#111827', 'Negro',         0, 1),
  ('nex-46', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-47', '#1E293B', 'Azul noche',    0, 1),
  ('nex-47', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-48', '#374151', 'Grafito',       0, 1),
  ('nex-48', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-49', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-49', '#111827', 'Negro',         0, 2),

  ('nex-50', '#4B5D3A', 'Verde oliva',   0, 1),
  ('nex-50', '#111827', 'Negro',         0, 2),

  ('nex-51', '#E5E0D8', 'Arena',         1, 1),
  ('nex-51', '#111827', 'Negro',         0, 2),

  ('nex-52', '#1E293B', 'Azul noche',    0, 1),
  ('nex-52', '#FFFFFF', 'Blanco',        1, 2),

  ('nex-53', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-53', '#111827', 'Negro',         0, 2),

  -- Colección Fútbol
  ('nex-54', '#1E293B', 'Azul noche',    0, 1),
  ('nex-54', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-55', '#FFFFFF', 'Blanco',        1, 1),
  ('nex-55', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-56', '#374151', 'Grafito',       0, 1),
  ('nex-56', '#111827', 'Negro',         0, 2),

  ('nex-57', '#1E293B', 'Azul noche',    0, 1),
  ('nex-57', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-58', '#1E293B', 'Azul noche',    0, 1),
  ('nex-58', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-59', '#1E293B', 'Azul noche',    0, 1),
  ('nex-59', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  -- Colección Running
  ('nex-60', '#1E293B', 'Azul noche',    0, 1),
  ('nex-60', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-61', '#1E293B', 'Azul noche',    0, 1),
  ('nex-61', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-62', '#1E293B', 'Azul noche',    0, 1),
  ('nex-62', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-63', '#1E293B', 'Azul noche',    0, 1),
  ('nex-63', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-64', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-64', '#1E293B', 'Azul noche',    0, 2),

  ('nex-65', '#1E293B', 'Azul noche',    0, 1),
  ('nex-65', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-66', '#1E293B', 'Azul noche',    0, 1),
  ('nex-66', '#FFFFFF', 'Blanco',        1, 2),
  ('nex-66', '#FF5A1F', 'Naranja NEXFIT',0, 3),

  ('nex-67', '#1E293B', 'Azul noche',    0, 1),
  ('nex-67', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-68', '#FFFFFF', 'Blanco',        1, 1),
  ('nex-68', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-69', '#1E293B', 'Azul noche',    0, 1),
  ('nex-69', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-70', '#1E293B', 'Azul noche',    0, 1),
  ('nex-70', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-71', '#1E293B', 'Azul noche',    0, 1),
  ('nex-71', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-72', '#1E293B', 'Azul noche',    0, 1),
  ('nex-72', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-73', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-73', '#1E293B', 'Azul noche',    0, 2),

  ('nex-74', '#1E293B', 'Azul noche',    0, 1),
  ('nex-74', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-75', '#1E293B', 'Azul noche',    0, 1),
  ('nex-75', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-76', '#111827', 'Negro',         0, 1),
  ('nex-76', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  -- Colección Athleisure
  ('nex-77', '#1E293B', 'Azul noche',    0, 1),
  ('nex-77', '#111827', 'Negro',         0, 2),

  ('nex-78', '#1E293B', 'Azul noche',    0, 1),
  ('nex-78', '#111827', 'Negro',         0, 2),

  ('nex-79', '#E5E0D8', 'Arena',         1, 1),
  ('nex-79', '#111827', 'Negro',         0, 2),

  ('nex-80', '#374151', 'Grafito',       0, 1),
  ('nex-80', '#1E293B', 'Azul noche',    0, 2),

  ('nex-81', '#374151', 'Grafito',       0, 1),
  ('nex-81', '#1E293B', 'Azul noche',    0, 2),

  ('nex-82', '#E5E0D8', 'Arena',         1, 1),
  ('nex-82', '#111827', 'Negro',         0, 2),

  ('nex-83', '#E5E0D8', 'Arena',         1, 1),
  ('nex-83', '#1E293B', 'Azul noche',    0, 2),

  ('nex-84', '#1E293B', 'Azul noche',    0, 1),
  ('nex-84', '#FF5A1F', 'Naranja NEXFIT',0, 2),

  ('nex-85', '#E5E0D8', 'Arena',         1, 1),

  ('nex-86', '#FF5A1F', 'Naranja NEXFIT',0, 1),
  ('nex-86', '#E5E0D8', 'Arena',         1, 2),

  ('nex-87', '#AE3200', 'Terracota',     0, 1),
  ('nex-87', '#111827', 'Negro',         0, 2),

  ('nex-88', '#C4999B', 'Rosa palo',     0, 1),
  ('nex-88', '#E5E0D8', 'Arena',         1, 2),

  ('nex-89', '#AE3200', 'Terracota',     0, 1),
  ('nex-89', '#111827', 'Negro',         0, 2),

  ('nex-90', '#FFFFFF', 'Blanco',        1, 1),
  ('nex-90', '#111827', 'Negro',         0, 2);

-- ----------------------------------------------------------------------------
--  7.5 Cuenta de ejemplo
--      Correo:    demo@nexfit.es
--      Contraseña: Nexfit2026
--      El hash sigue el formato del backend (scrypt, sal aleatoria de 16 bytes
--      + derivación de 64 bytes). Cámbiala antes de publicar nada real.
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('usr-a1b2c3d4',
   'Alba García',
   'demo@nexfit.es',
   '3cbe01af07c9a0cdf23edbffc6d2cb8d:113b70b83b2410ca6cc82f6ba16646fedaae192ee70cf7ff638955a5ed9c7af47dc62da284089da33ec88446cd0f185e88950352bb6f5ffa219612e8243ead6f',
   'cliente');

COMMIT;

-- ============================================================================
--  8. DATOS TRANSACCIONALES DE EJEMPLO (opcionales)
--     Sirven para probar consultas y relaciones. Si no los quieres, borra
--     esta sección antes de importar el script.
-- ============================================================================

START TRANSACTION;

-- 8.1 Dos favoritos del usuario demo (el corazón de la cabecera)
INSERT INTO favorites (user_id, product_id) VALUES
  ('usr-a1b2c3d4', 'nex-02'),
  ('usr-a1b2c3d4', 'nex-05');

-- 8.2 Cesta abierta del usuario demo con dos líneas
INSERT INTO carts (user_id, status) VALUES ('usr-a1b2c3d4', 'abierto');

INSERT INTO cart_items (cart_id, product_id, size, color_hex, quantity, unit_price) VALUES
  (LAST_INSERT_ID(), 'nex-02', 'XS', '#004B71', 1, 49.95),
  (LAST_INSERT_ID(), 'nex-05', 'L',  '#111827', 1, 32.50);

-- 8.3 Un pedido entregado (histórico)
INSERT INTO orders
  (order_number, user_id, status, subtotal, shipping_cost, discount, total,
   currency, payment_method, shipping_name, shipping_email, shipping_phone,
   shipping_address, shipping_city, shipping_postal_code, shipping_country)
VALUES
  ('NXF-000001', 'usr-a1b2c3d4', 'entregado', 98.85, 0.00, 0.00, 98.85,
   'EUR', 'tarjeta', 'Alba García', 'demo@nexfit.es', '+34 600 000 000',
   'Calle Mayor 14, 3.º B', 'Madrid', '28013', 'ES');

INSERT INTO order_items (order_id, product_id, product_name, size, color_hex, quantity, unit_price) VALUES
  (LAST_INSERT_ID(), 'nex-01', 'Camiseta Técnica Transpirable NEX-Pro', 'M', '#111827', 2, 34.95),
  (LAST_INSERT_ID(), 'nex-06', 'Top Deportivo Impact Control', 'S', '#AE3200', 1, 28.95);

COMMIT;

-- ============================================================================
--  9. COMPROBACIÓN DE LA IMPORTACIÓN
-- ============================================================================
SELECT 'categories'             AS tabla, COUNT(*) AS filas FROM categories
UNION ALL SELECT 'products',            COUNT(*) FROM products
UNION ALL SELECT 'product_sizes',       COUNT(*) FROM product_sizes
UNION ALL SELECT 'product_colors',      COUNT(*) FROM product_colors
UNION ALL SELECT 'users',               COUNT(*) FROM users
UNION ALL SELECT 'sessions',            COUNT(*) FROM sessions
UNION ALL SELECT 'favorites',           COUNT(*) FROM favorites
UNION ALL SELECT 'carts',               COUNT(*) FROM carts
UNION ALL SELECT 'cart_items',          COUNT(*) FROM cart_items
UNION ALL SELECT 'newsletter_subscribers', COUNT(*) FROM newsletter_subscribers
UNION ALL SELECT 'orders',              COUNT(*) FROM orders
UNION ALL SELECT 'order_items',         COUNT(*) FROM order_items;

-- Catálogo tal y como lo devolvería la tienda
SELECT id, name, category_label, price, original_price, discount_percent, rating, sizes, colors, stock_total, badge_label
FROM v_catalog
ORDER BY id;
