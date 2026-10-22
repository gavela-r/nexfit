# DBeaver · conectar con la base de datos NEXFIT

La base de datos ya está construida dentro del contenedor `nexfit-db` a partir
de `nexfit.sql`, con los mismos datos de configuración que usa Docker Compose.
DBeaver solo necesita apuntar a ese servidor.

## Opción A · Conectar al MySQL del contenedor (recomendada)

### Datos de conexión

| Campo | Valor |
| --- | --- |
| Motor | MySQL 8 |
| Servidor | `localhost` (o `127.0.0.1`) |
| Puerto | `3307` |
| Base de datos | `nexfit` |
| Usuario | `nexfit` |
| Contraseña | `nexfit_pass` |
| Usuario root | `root` / `nexfit_root` |

> El puerto del contenedor es 3306, pero se publica en el **3307** del equipo
> para no chocar con un MySQL o XAMPP que ya estuviera usando el 3306.

### Pasos en DBeaver

1. **Database → New Database Connection** (o el botón del enchufe con «+»).
2. Elige **MySQL** y pulsa *Next*.
3. Rellena:
   - *Server Host*: `localhost`
   - *Port*: `3307`
   - *Database*: `nexfit`
   - *Username*: `nexfit`
   - *Password*: `nexfit_pass`
4. Si DBeaver pide descargar el **driver de MySQL**, acepta (*Download*).
5. Pulsa **Test Connection**. Debe responder *Connected*.
6. *Finish*. En el árbol de la izquierda verás la conexión con la base `nexfit`.

### Si la conexión falla

| Mensaje | Solución |
| --- | --- |
| `Public Key Retrieval is not allowed` | Botón derecho en la conexión → *Edit Connection* → pestaña **Driver properties** → añade `allowPublicKeyRetrieval` = `true`. |
| `Communications link failure` | El contenedor está parado: `docker compose up -d` en la carpeta del proyecto. |
| `Access denied for user` | Usa exactamente `nexfit` / `nexfit_pass` (sin tilde ni mayúsculas). |
| El puerto 3307 ocupado | Cambia `DB_PORT` en un `.env` y reinicia: `docker compose up -d`. |

### Qué deberías ver

- **12 tablas**: `categories`, `products`, `product_sizes`, `product_colors`,
  `users`, `sessions`, `favorites`, `carts`, `cart_items`,
  `newsletter_subscribers`, `orders`, `order_items`.
- **2 vistas**: `v_catalog` y `v_cart_totals`.
- **Datos cargados**: 6 categorías, 6 productos (24 tallas y 17 colores),
  1 cuenta demo (`demo@nexfit.es` / `Nexfit2026`), 2 favoritos, 1 cesta y 1 pedido
  de ejemplo.

### Consultas para comprobar desde DBeaver

```sql
-- Abre un editor SQL sobre la conexión y ejecuta:
SELECT COUNT(*) AS productos FROM products;
SELECT * FROM v_catalog ORDER BY id;
SELECT cart_id, line_count, units, subtotal FROM v_cart_totals;
SELECT id, name, email FROM users;
```

### Recrear la base desde cero

```bash
docker compose down -v      # borra el volumen (y los datos)
docker compose up -d        # vuelve a ejecutar nexfit.sql
```

## Opción B · MySQL local (sin Docker)

Si en algún momento quieres la base en un MySQL instalado en tu equipo:

```bash
mysql -u root -p < nexfit.sql
```

Después, para tener el mismo usuario que crea Docker, ejecuta una vez como root:

```bash
mysql -u root -p < db/crear-usuario-nexfit.sql
```

En DBeaver cambia solo el puerto: `3306` (el de tu MySQL local). El resto de
datos (base `nexfit`, usuario `nexfit`, contraseña `nexfit_pass`) es idéntico.

## Configuración del stack (referencia)

Variables del `docker-compose.yml` y sus valores por defecto:

| Variable | Valor por defecto |
| --- | --- |
| `MYSQL_ROOT_PASSWORD` | `nexfit_root` |
| `MYSQL_DATABASE` | `nexfit` |
| `MYSQL_USER` | `nexfit` |
| `MYSQL_PASSWORD` | `nexfit_pass` |
| `DB_PORT` | `3307` |

Se pueden cambiar copiando `.env.example` a `.env` y reiniciando el stack.
