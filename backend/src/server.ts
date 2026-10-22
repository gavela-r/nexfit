// server.ts
// Arranque del servidor HTTP con comprobación de MySQL y cierre ordenado.
import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { closePool, waitForDatabase } from "./db/pool";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  // No se abre el puerto hasta que MySQL responda (Docker tarda unos segundos).
  await waitForDatabase();

  const app = createApp();

  const server: Server = app.listen(env.port, () => {
    logger.info(`API NEXFIT escuchando en http://localhost:${env.port}`);
    logger.info(`Entorno: ${env.nodeEnv} · BD: ${env.db.name}@${env.db.host}:${env.db.port}`);
    logger.info(`CORS permitido: ${env.corsOrigins.join(", ")}`);
  });

  function shutdown(signal: string): void {
    logger.info(`${signal} recibido, cerrando el servidor…`);
    server.close(() => {
      void closePool()
        .catch(() => undefined)
        .finally(() => {
          logger.info("Servidor cerrado");
          process.exit(0);
        });
    });
    // Por si alguna petición se queda colgada
    setTimeout(() => process.exit(1), 5000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

void main().catch((error) => {
  logger.error("No se pudo arrancar la API", error);
  process.exit(1);
});
