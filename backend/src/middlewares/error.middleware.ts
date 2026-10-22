// middlewares/error.middleware.ts
// Not found para la API + manejador global de errores con respuesta JSON.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { respondError } from "../utils/respond";

/** 404 en JSON para cualquier /api que no exista. */
export const notFoundHandler: RequestHandler = (req, res) => {
  respondError(res, 404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
};

/** Convierte cualquier error lanzado en una respuesta JSON coherente. */
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    respondError(res, error.status, error.message, error.details);
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    respondError(res, 400, "El cuerpo de la petición no es JSON válido");
    return;
  }

  logger.error(`${req.method} ${req.originalUrl}`, error);
  respondError(res, 500, "Error interno del servidor");
};
