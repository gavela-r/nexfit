// config/env.ts
// Variables de entorno tipadas, con valores por defecto para desarrollo.
import dotenv from "dotenv";

dotenv.config();

function readInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: readInt(process.env.PORT, 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173,http://localhost:4173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /** Ruta al build del frontend para servir la SPA desde el backend.
   *  Se resuelve relativa a la ubicación del código (backend/src o backend/dist). */
  frontendDist: process.env.FRONTEND_DIST ?? "../../frontend/dist",
  /** Conexión MySQL (todas las tablas del proyecto viven aquí). */
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: readInt(process.env.DB_PORT, 3307),
    user: process.env.DB_USER ?? "nexfit",
    password: process.env.DB_PASSWORD ?? "nexfit_pass",
    name: process.env.DB_NAME ?? "nexfit",
    connectionLimit: readInt(process.env.DB_POOL, 10),
  },
  /** Reintentos de arranque mientras MySQL termina de levantar (Docker). */
  dbRetries: readInt(process.env.DB_RETRIES, 15),
} as const;
