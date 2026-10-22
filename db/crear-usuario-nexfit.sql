-- ============================================================================
--  NEXFIT · Usuario de aplicación (opcional)
-- ----------------------------------------------------------------------------
--  Docker crea este usuario automáticamente con las variables MYSQL_USER y
--  MYSQL_PASSWORD del docker-compose.yml. Este fichero sirve para reproducir
--  exactamente la misma configuración en un MySQL local o en un hosting:
--
--      mysql -u root -p < nexfit.sql
--      mysql -u root -p < db/crear-usuario-nexfit.sql
--
--  Ejecutar como root (o un usuario con permiso CREATE USER / GRANT).
--  Cambia la contraseña antes de usar esto en un servidor real.
-- ============================================================================

CREATE USER IF NOT EXISTS 'nexfit'@'%' IDENTIFIED BY 'nexfit_pass';
GRANT ALL PRIVILEGES ON nexfit.* TO 'nexfit'@'%';

-- Acceso desde el propio servidor (DBeaver en local suele conectar así)
CREATE USER IF NOT EXISTS 'nexfit'@'localhost' IDENTIFIED BY 'nexfit_pass';
GRANT ALL PRIVILEGES ON nexfit.* TO 'nexfit'@'localhost';

FLUSH PRIVILEGES;

-- Comprobación
SHOW GRANTS FOR 'nexfit'@'%';
