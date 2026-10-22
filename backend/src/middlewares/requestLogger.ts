// middlewares/requestLogger.ts
// Log de peticiones en desarrollo (se omite en producción y en tests).
import type { RequestHandler } from "express";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  if (env.isProduction || env.nodeEnv === "test") {
    next();
    return;
  }

  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });

  next();
};
