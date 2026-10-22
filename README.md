# NEXFIT · MOVE WITH INTENT

Tienda online de ropa deportiva técnica y athleisure para hombre y mujer.

El proyecto está dividido en dos aplicaciones independientes:

- **`frontend/`** — SPA hecha en **React 18 + TypeScript**, compilada con **Vite** y estilizada con **Tailwind CSS 3**.
- **`backend/`** — API REST hecha en **TypeScript sobre Express (Node.js)**.

La interfaz es la evolución a React del prototipo estático original (`original/code.html`),
respetando el diseño definido en `DESIGN.md` (paleta, tipografías Manrope + Inter, contenedor de 1320 px y radios de 16 px).

---

## 1. Requisitos

- Node.js **18 o superior** (probado con Node 24)
- npm 10 o superior
- **MySQL 8.0.16 o superior**. Lo más rápido es levantar solo la base del stack
  Docker (`docker compose up -d db`), que publica el puerto **3307**.

## 2. Puesta en marcha

```bash
# 1) Instalar dependencias de las dos aplicaciones
npm install
npm run setup          # instala frontend/ y backend/

# 2) Base de datos: esquema + catálogo (solo la primera vez)
docker compose up -d db

# 3) Arrancar las dos a la vez (modo desarrollo)
npm run dev
```

El backend se conecta a MySQL con las variables `DB_*` (por defecto
`127.0.0.1:3307`, base `nexfit`, usuario `nexfit` / `nexfit_pass`). Si usas otro
servidor, copia `backend/.env.example` a `backend/.env` y ajusta los valores.

| Servicio                 | URL                   |
| ------------------------ | --------------------- |
| Frontend (Vite, con HMR) | http://localhost:5173 |
| Backend (API Express)    | http://localhost:4000 |

Vite envía `/api/*` al backend a través del proxy definido en `frontend/vite.config.ts`,
así que no hay que configurar CORS para el desarrollo.

También se pueden arrancar por separado:

```bash
npm run dev:frontend    # sólo React
npm run dev:backend     # sólo API
```

### Compilar y ejecutar en producción

```bash
npm run build           # tsc + vite build  y  tsc del backend
npm start               # el backend sirve la API y la SPA compilada en :4000
```

Si existe `frontend/dist`, `backend/src/app.ts` lo sirve automáticamente junto con la API,
de modo que con un solo proceso queda la tienda completa en http://localhost:4000.

### Comprobaciones

```bash
npm run typecheck       # tsc --noEmit en frontend y backend
```

## 3. Estructura del proyecto

```
nexfit/
├── README.md
├── DESIGN.md                     # Manual de diseño (colores, tipografía, espaciado)
├── package.json                  # Scripts raíz (dev · build · typecheck)
├── docker-compose.yml            # Stack: MySQL + backend + frontend
├── .env.example                  # Variables del stack (puertos, contraseñas)
├── nexfit.sql                    # Base de datos MySQL 8 (esquema + catálogo)
├── .prettierrc / .prettierignore
├── docs/
│   ├── screen.png                # Captura de referencia de la página
│   └── dbeaver.md                # Conexión a la base de datos desde DBeaver
├── db/
│   └── crear-usuario-nexfit.sql  # Usuario de app para un MySQL local (opcional)
├── original/
│   └── code.html                 # Prototipo estático v1 (referencia histórica)
├── frontend/                     # React + TypeScript + Vite + Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts            # Proxy /api → :4000
│   ├── Dockerfile                # Build con Vite + Nginx
│   ├── nginx.conf                # SPA + proxy /api → backend
│   ├── tailwind.config.js        # Tokens de DESIGN.md
│   ├── postcss.config.js
│   ├── public/
│   │   └── assets/               # Vídeos HD y póster del hero
│   └── src/
│       ├── main.tsx              # Punto de entrada
│       ├── App.tsx               # Composición de la página
│       ├── index.css             # Base de Tailwind + estilos globales
│       ├── api/index.ts          # Cliente HTTP con respaldo local
│       ├── hooks/useTheme.ts     # Modo claro/oscuro persistido
│       ├── hooks/useAuth.ts      # Sesión: registro, login y token en localStorage
│       ├── utils/format.ts       # Formato de precios (es-ES)
│       ├── utils/search.ts       # Búsqueda sin tildes ni mayúsculas
│       ├── data/products.ts      # Catálogo tipado (respaldo)
│       └── components/
│           ├── AnnouncementBar.tsx     # Barra de anuncio superior
│           ├── Header.tsx              # Logo, nav, buscador, acceso, carrito y tema
│           ├── AuthModal.tsx           # Acceso: iniciar sesión / crear cuenta
│           ├── HeroSection.tsx         # Hero con vídeo HD sincronizado
│           ├── CollectionBanners.tsx   # Colecciones Hombre / Mujer
│           ├── CategoriesSection.tsx   # 6 disciplinas deportivas
│           ├── BeginnerGuide.tsx       # Guía "¿por dónde empiezo?"
│           ├── CatalogSection.tsx      # Rejilla + filtros + carga de API
│           ├── ProductCard.tsx         # Tarjeta con tallas, colores y alta
│           ├── SearchOverlay.tsx       # Buscador global en overlay (⌘K)
│           ├── SupportBanner.tsx       # Atención al cliente
│           ├── TechBanner.tsx          # Innovación textil + cupón MOVE15
│           ├── PillarsSection.tsx      # 4 pilares del estándar NEXFIT
│           ├── TrustBar.tsx            # Barra de confianza
│           └── FooterSection.tsx       # Pie, enlaces y newsletter
└── backend/                      # Express + TypeScript
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile                # Build con tsc + imagen node:22-alpine
    ├── .env.example              # PORT, NODE_ENV, CORS_ORIGIN, DB_*
    └── src/
        ├── server.ts             # Arranque (espera a MySQL) y cierre ordenado
        ├── app.ts                # Middlewares, rutas y estáticos
        ├── config/env.ts         # Variables de entorno tipadas (incluye DB_*)
        ├── db/                   # Pool de MySQL, consultas y errores de integridad
        ├── routes/               # Endpoints (catálogo, carrito, favoritos, club, auth)
        ├── controllers/          # Validación de entrada y respuesta
        ├── services/             # Consultas y lógica de negocio contra MySQL
        ├── middlewares/          # Auth (Bearer), logger, 404 y errores
        ├── types/                # Modelos de dominio y de respuesta
        └── utils/                # ApiError, asyncHandler, respond, logger, password, normalize
```

## 4. API

Todas las respuestas usan el envoltorio `{ "ok": boolean, "data" | "error": ... }`.
El backend lee y escribe **todo en MySQL** (`nexfit.sql`): catálogo, cuentas,
sesiones, carrito, favoritos y newsletter.

| Método   | Ruta                         | Descripción                                                                                   |
| -------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `GET`    | `/api/health`                | Estado del servicio y de la base de datos (`503` si MySQL no responde)                        |
| `GET`    | `/api/products`              | Catálogo desde MySQL. Acepta `?category=`, `?search=` y `?sort=rating\|price-asc\|price-desc` |
| `GET`    | `/api/products/:id`          | Detalle de un producto (404 si no existe)                                                     |
| `GET`    | `/api/categories`            | Las 6 disciplinas con su número de artículos                                                  |
| `GET`    | `/api/cart`                  | Carrito (unidades y total) del usuario o del invitado                                         |
| `POST`   | `/api/cart/items`            | Añade una línea (`productId`, `size`, `color`, `quantity`)                                    |
| `DELETE` | `/api/cart/items/:productId` | Quita un producto del carrito                                                                 |
| `DELETE` | `/api/cart`                  | Vacía el carrito                                                                              |
| `GET`    | `/api/favorites`             | Favoritos del usuario · requiere sesión                                                       |
| `POST`   | `/api/favorites`             | Marca un producto (`{ "productId": "nex-01" }`) · requiere sesión                             |
| `DELETE` | `/api/favorites/:productId`  | Desmarca un producto · requiere sesión                                                        |
| `POST`   | `/api/newsletter/subscribe`  | Suscripción al Club NEXFIT (`{ "email": "..." }`)                                             |
| `GET`    | `/api/newsletter/stats`      | Número de suscriptores                                                                        |
| `POST`   | `/api/auth/register`         | Crea la cuenta e inicia sesión (`name`, `email`, `password`) · `409` si el correo ya existe   |
| `POST`   | `/api/auth/login`            | Inicia sesión (`email`, `password`) · `401` si las credenciales no coinciden                  |
| `POST`   | `/api/auth/logout`           | Cierra la sesión del token (`Authorization: Bearer <token>`)                                  |
| `GET`    | `/api/auth/me`               | Perfil de la sesión abierta (`Authorization: Bearer <token>`)                                 |

**Identidad del carrito.** Con sesión, el carrito es del usuario
(`Authorization: Bearer <token>`). Sin sesión, el backend crea una cesta de
invitado y devuelve `cartToken`; el navegador lo guarda en `localStorage`
(`nexfit_cart_token`) y lo envía en la cabecera `X-Cart-Token`. Al iniciar
sesión o registrarse, las líneas del invitado se fusionan con la cuenta.

Ejemplos:

```bash
curl http://localhost:4000/api/products?sort=price-asc
curl -X POST http://localhost:4000/api/cart/items \
  -H "Content-Type: application/json" \
  -d '{"productId":"nex-01","size":"M","color":"#FF5A1F","quantity":1}'
curl -X POST http://localhost:4000/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"hola@nexfit.es"}'
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","email":"ana@nexfit.es","password":"potencia2026"}'
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@nexfit.es","password":"potencia2026"}'
```

Los errores de validación devuelven `400` con `details`; los desconocidos, `404`;
las credenciales incorrectas o el token inválido, `401`; un correo ya registrado, `409`;
cualquier otra excepción cae en el manejador global y responde `500` en JSON
(`backend/src/middlewares/error.middleware.ts`).

## 5. Comportamiento de la interfaz

- **Modo claro por defecto**, conmutador en la cabecera y persistencia en
  `localStorage` bajo la clave `nexfit_theme` (`useTheme`).
- **Hero con vídeo**: capa nítida + capa desenfocada de fondo sincronizada mediante
  `timeupdate`; en pantallas verticales se sustituye por `hero-mobile.mp4` y, si el
  navegador bloquea el autoplay, el vídeo arranca con la primera interacción.
- **Catálogo**: pide los productos a `/api/products`. Si el backend está apagado,
  usa el catálogo local y lo indica con el texto _«Catálogo local de respaldo»_.
- **Filtros**: Más Vendidos · Novedades · Entrenamiento · Running, con estado vacío.
- **Buscador (doble acceso)**:
  - Icono de lupa en la cabecera y atajo **⌘K / Ctrl+K** abren `SearchOverlay`, un panel
    superpuesto (portal en `body`, por lo que el `backdrop-blur` de la cabecera no lo afecta)
    con resultados en vivo contra `GET /api/products?search=`, debounce de 250 ms, cancelación
    de peticiones obsoletas, navegación con **↑ ↓**, apertura con **Intro** y cierre con **Esc**
    o pulsando el fondo.
  - Campo de búsqueda dentro de la sección **Productos Destacados**, junto a los chips de
    filtro: filtra la rejilla en caliente por nombre o categoría y muestra el recuento
    «X de Y productos». El término está compartido con `App`, así que al elegir un resultado
    del overlay el catálogo se filtra con ese producto y la página hace scroll hasta él.
- **Tarjetas**: talla, color y favorito. El corazón guarda el producto en
  `favorites` (si no hay sesión, abre el panel de acceso) y el botón «Añadir»
  actualiza el contador y envía la línea a `cart_items`; la cabecera refleja el
  carrito real, también después de recargar.
- **Cuenta**: la cabecera muestra **«Iniciar sesión»** y **«Registro»**. Ambos abren
  `AuthModal` con pestañas, validación local y los avisos del backend (contraseña
  incorrecta, correo ya registrado...). Al completar el acceso aparece un aviso
  flotante en la esquina inferior derecha («Sesión iniciada correctamente» o
  «¡Registro completado!») que se cierra solo a los 4,5 s o con la ✕. Al registrarse
  se crea la fila en `users`,
  se abre una sesión en `sessions` y la cabecera pasa a mostrar el avatar con las
  iniciales y el nombre, junto al botón de salir. El token se guarda en
  `localStorage` (`nexfit_auth_token`) y se revalida al recargar con
  `GET /api/auth/me`; si ha dejado de ser válido, se descarta sin avisar.
- **Contadores**: el carrito y los favoritos muestran cifras reales de la base
  (0 si el usuario aún no tiene nada) y se mantienen al recargar y entre sesiones.
- **Newsletter**: alta real contra la API con estados de carga, éxito y error.
- **Cupón MOVE15**: copia al portapapeles y muestra confirmación visual.

## 6. Notas de implementación

- **`rollup` en modo WASM**: `frontend/package.json` fija
  `"rollup": "npm:@rollup/wasm-node@^4.64.0"` porque este equipo bloquea los binarios
  nativos `.node` con una directiva de Control de aplicaciones y `vite build` fallaba
  al cargar `rollup.win32-x64-msvc.node`. En un equipo sin esa restricción puedes
  sustituirla por `"rollup": "^4.64.0"` para usar la versión nativa (compilación más rápida).
- **Assets compartidos**: los vídeos y el póster viven en `frontend/public/assets`, de
  donde Vite los copia a `frontend/dist` en cada build. El prototipo `original/code.html`
  apunta a esa misma carpeta.
- **Persistencia en MySQL**: no hay datos de negocio en memoria. `db/pool.ts` abre un
  pool (`mysql2`) y cada servicio consulta su tabla: `users` y `sessions` (auth),
  `v_catalog`/`categories` (catálogo), `carts`/`cart_items` (carrito), `favorites`
  y `newsletter_subscribers`. `nexfit.sql` crea el esquema y los datos de ejemplo.
  Al arrancar, el backend espera a que MySQL responda antes de abrir el puerto
  (`waitForDatabase`) y `/api/health` comprueba la conexión.
- **Contraseñas y sesiones**: las contraseñas se guardan con `scrypt` y sal aleatoria
  (`utils/password.ts`), nunca en claro, en `users.password_hash`. Los tokens son
  32 bytes aleatorios y viven en la tabla `sessions`
  (`token`, `user_id`, `expires_at`, `last_used_at`); al cerrar sesión se borra la fila.
- **Imágenes de producto**: las tarjetas y banners usan URLs remotas tal y como figuran
  en la maqueta original.
- Se recomienda ejecutar `npm run typecheck` y `npm run build` antes de compartir cambios.

## 7. Formateo

```bash
npx prettier --write .
```

La configuración está en `.prettierrc` (100 columnas, comillas dobles, punto y coma).

## 8. Base de datos (`nexfit.sql`)

Script único en la raíz con todo el modelo de datos de la tienda, escrito para
**MySQL 8.0.16 o superior** (InnoDB, `utf8mb4_0900_ai_ci`). Crea la base de datos
`nexfit`, las 12 tablas, 2 vistas y carga el catálogo real de la web.

### Importar

```bash
# Terminal
mysql -u root -p < nexfit.sql
```

- **phpMyAdmin**: pestaña _Importar_ → seleccionar `nexfit.sql` → _Continuar_.
- **MySQL Workbench / DBeaver**: _File → Run SQL Script_ → `nexfit.sql`.

El script se puede ejecutar varias veces: elimina y vuelve a crear las tablas,
así que siempre deja la base de datos en el mismo estado.

### Tablas

| Tabla                    | Contenido                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `categories`             | 6 disciplinas deportivas (fitness, running, athleisure, fútbol, crossfit, outdoor)                                                                            |
| `products`               | Catálogo. `id` es el SKU que ya usa la API (`nex-01`…), `badge_tone` guarda el significado del distintivo (sin CSS), `audience` alimenta el menú Hombre/Mujer |
| `product_sizes`          | Tallas con stock y orden de presentación                                                                                                                      |
| `product_colors`         | Muestras de color; `has_border` marca los tonos claros que necesitan borde                                                                                    |
| `users`                  | Cuentas. `password_hash` en formato `sal:hash` (scrypt)                                                                                                       |
| `sessions`               | Tokens Bearer (32 bytes en hexadecimal) con caducidad opcional                                                                                                |
| `favorites`              | Favoritos por usuario (el corazón de la cabecera)                                                                                                             |
| `carts` / `cart_items`   | Cesta de usuario o invitado, con el precio congelado por línea                                                                                                |
| `newsletter_subscribers` | Altas del Club NEXFIT                                                                                                                                         |
| `orders` / `order_items` | Pedidos y su histórico (copia de nombre, talla y precio)                                                                                                      |

**Vistas**: `v_catalog` (producto + categoría + tallas + colores + stock en una
fila, lista para pintar la parrilla) y `v_cart_totals` (líneas, unidades y
subtotal de cada cesta).

**Cuenta de ejemplo**: `demo@nexfit.es` / `Nexfit2026`. Es solo un dato de
prueba: cámbialo antes de publicar nada real.

### Consultas útiles

```sql
-- Catálogo tal y como lo pinta la web
SELECT id, name, category_label, price, original_price, discount_percent,
       rating, sizes, colors, stock_total, badge_label
FROM v_catalog ORDER BY id;

-- Carrito del usuario y su total
SELECT ci.product_id, p.name, ci.size, ci.color_hex, ci.quantity, ci.unit_price
FROM cart_items ci
JOIN carts c ON c.id = ci.cart_id
JOIN products p ON p.id = ci.product_id
WHERE c.user_id = 'usr-a1b2c3d4';

-- Comprobar credenciales (el hash lo verifica el backend, no SQL)
SELECT id, name, email, password_hash FROM users WHERE email = 'demo@nexfit.es';
```

### Relación con el código

El backend **ya usa esta base de datos para todo**: el catálogo sale de
`v_catalog`, las cuentas de `users`, las sesiones de `sessions`, el carrito de
`carts`/`cart_items`, los favoritos de `favorites` y el Club de
`newsletter_subscribers`. No queda ningún dato de negocio en memoria.

| Servicio                         | Tablas / vistas                                      |
| -------------------------------- | ---------------------------------------------------- |
| `services/product.service.ts`    | `v_catalog`, `product_colors`, `categories`          |
| `services/auth.service.ts`       | `users` + `sessions`                                 |
| `services/cart.service.ts`       | `carts` + `cart_items` (+ `products` para el precio) |
| `services/favorites.service.ts`  | `favorites`                                          |
| `services/newsletter.service.ts` | `newsletter_subscribers`                             |

Los datos transaccionales de ejemplo (2 favoritos, 1 cesta con 2 líneas y 1
pedido entregado) están en la sección 8 del script, marcada como opcional: si
prefieres empezar con las tablas vacías, borra ese bloque antes de importar.

## 9. Docker

El proyecto se levanta completo con Docker Compose: base de datos, API y tienda.

| Servicio   | Imagen                    | Puerto en tu equipo | Qué hace                                             |
| ---------- | ------------------------- | ------------------- | ---------------------------------------------------- |
| `db`       | `mysql:8.0`               | `3307` → 3306       | MySQL con `nexfit.sql` cargado en el primer arranque |
| `backend`  | Node 22 (build propio)    | `4000`              | API Express compilada con `tsc`                      |
| `frontend` | Nginx 1.27 (build propio) | `8080`              | React compilado + proxy `/api` → backend             |

### Arrancar

```bash
docker compose up -d --build
```

- Tienda: <http://localhost:8080>
- API: <http://localhost:4000/api/health>
- MySQL: `localhost:3307` · usuario `nexfit` / contraseña `nexfit_pass`
  (root: `nexfit_root`)

### Comandos habituales

```bash
docker compose ps                 # estado y salud de los contenedores
docker compose logs -f backend    # registros en directo
docker compose logs -f db         # salida de la importación inicial
docker compose down               # parar (los datos se conservan)
docker compose down -v            # parar y borrar el volumen de MySQL
```

### Detalles

- **Primer arranque**: el volumen `nexfit_db_data` está vacío y MySQL ejecuta
  `nexfit.sql` desde `/docker-entrypoint-initdb.d`. Tarda unos segundos; cuando
  el contenedor pasa a `healthy`, la base ya tiene las 12 tablas, las 2 vistas y
  el catálogo. Si editas el script, fuerza una recarga con
  `docker compose down -v && docker compose up -d`.
- **Sin CORS**: el navegador habla con `/api` en el mismo puerto 8080 y Nginx lo
  reenvía al backend. Las llamadas directas a `:4000` sí usan `CORS_ORIGIN`.
- **Puertos**: si alguno está ocupado, cámbialo en un fichero `.env`
  (copia `.env.example`) sin tocar el compose.
- **Contraseñas**: los valores del compose son de práctica. Cámbialos en `.env`
  antes de publicar el proyecto.
- **Backend y base de datos**: la API espera a que `db` esté `healthy`
  (`depends_on: condition: service_healthy`) y se conecta con `DB_HOST=db`,
  `DB_PORT=3306`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`. Todo lo que haces en la
  tienda (registro, sesión, carrito, favoritos, newsletter) queda escrito en
  MySQL y sobrevive a reinicios; puedes verlo en DBeaver con `F5`.
- **Desarrollo local**: `npm run dev` ocupa el puerto 4000, igual que el
  contenedor del backend. Para usar el servidor de Vite con recarga en caliente,
  para primero los contenedores (`docker compose stop backend`) o cambia
  `BACKEND_PORT` en `.env`.
- **DBeaver**: guía paso a paso en [`docs/dbeaver.md`](docs/dbeaver.md) —
  `localhost:3307`, base `nexfit`, usuario `nexfit`, contraseña `nexfit_pass`.
  Para un MySQL local sin Docker, importa `nexfit.sql` y luego
  `db/crear-usuario-nexfit.sql` (mismo usuario y contraseña).
