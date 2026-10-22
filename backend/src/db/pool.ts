// db/pool.ts
// Única puerta de entrada a MySQL: pool de conexiones y utilidades de consulta.
// Todas las consultas del backend pasan por aquí (nunca se concatenan valores).
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const pool: Pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  charset: "utf8mb4",
  timezone: "Z",
  // DECIMAL(10,2) llega como número y no como cadena.
  decimalNumbers: true,
});

/** SELECT: devuelve las filas tipadas. */
export async function rows<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [result] = await pool.query(sql, params);
  return result as T[];
}

/** INSERT / UPDATE / DELETE: devuelve el resultado (insertId, affectedRows...). */
export async function run(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.query(sql, params);
  return result as ResultSetHeader;
}

/** Comprueba que la base responde (lo usa /api/health y el arranque). */
export async function ping(): Promise<void> {
  await pool.query("SELECT 1");
}

/**
 * Espera a que MySQL acepte conexiones. En Docker la base tarda unos segundos
 * en estar lista; así el backend no muere en el primer intento.
 */
export async function waitForDatabase(attempts = env.dbRetries, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await ping();
      logger.info(`MySQL conectado en ${env.db.host}:${env.db.port}/${env.db.name}`);
      return;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      if (attempt === attempts) {
        logger.error(`No se pudo conectar a MySQL tras ${attempts} intentos: ${reason}`);
        throw error;
      }
      logger.warn(`MySQL no disponible (intento ${attempt}/${attempts}): ${reason}`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

/** Cierra el pool en el apagado ordenado del servidor. */
export async function closePool(): Promise<void> {
  await pool.end();
}
