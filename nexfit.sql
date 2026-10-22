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
--    7. Datos .......... 6 categorías + 6 productos reales + cuenta de ejemplo
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
  price          DECIMAL(10, 2)   NOT NULL,
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
  ('outdoor',    'Outdoor',                  93, 6);

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
--  7.3 Tallas y stock
-- ----------------------------------------------------------------------------
INSERT INTO product_sizes (product_id, size, stock, sort_order) VALUES
  ('nex-01', 'S',  12, 1), ('nex-01', 'M',  25, 2), ('nex-01', 'L',  18, 3), ('nex-01', 'XL',  6, 4),
  ('nex-02', 'XS',  8, 1), ('nex-02', 'S',  20, 2), ('nex-02', 'M',  14, 3), ('nex-02', 'L',   5, 4),
  ('nex-03', 'S',   6, 1), ('nex-03', 'M',  10, 2), ('nex-03', 'L',  16, 3), ('nex-03', 'XL',  9, 4),
  ('nex-04', 'S',  15, 1), ('nex-04', 'M',  22, 2), ('nex-04', 'L',  12, 3), ('nex-04', 'XL',  7, 4),
  ('nex-05', 'S',   9, 1), ('nex-05', 'M',  14, 2), ('nex-05', 'L',  20, 3), ('nex-05', 'XL', 11, 4),
  ('nex-06', 'XS', 10, 1), ('nex-06', 'S',  18, 2), ('nex-06', 'M',  12, 3), ('nex-06', 'L',   4, 4);

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
  ('nex-06', '#FFFFFF', 'Blanco',    1, 3);

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
