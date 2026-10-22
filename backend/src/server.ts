// server.ts
// Arranque del servidor HTTP con cierre ordenado.
import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

const server: Server = app.listen(env.port, () => {
  logger.info(`API NEXFIT escuchando en http://localhost:${env.port}`);
  logger.info(`Entorno: ${env.nodeEnv} · CORS permitido: ${env.corsOrigins.join(", ")}`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} recibido, cerrando el servidor…`);
  server.close(() => {
    logger.info("Servidor cerrado");
    process.exit(0);
  });
  // Por si alguna petición se queda colgada
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
