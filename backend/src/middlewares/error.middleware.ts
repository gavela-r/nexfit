// middlewares/error.middleware.ts
// Not found para la API + manejador global de errores con respuesta JSON.
import type { ErrorRequestHandler, RequestHandler } from "express";
import { isDuplicateEntry, isForeignKeyError, isStillReferencedError } from "../db/errors";
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

  // Errores de integridad de MySQL que deben llegar como 4xx y no como 500.
  if (isDuplicateEntry(error)) {
    respondError(res, 409, "Ya existe un registro con esos datos");
    return;
  }
  if (isForeignKeyError(error)) {
    respondError(res, 400, "La referencia indicada no existe");
    return;
  }
  if (isStillReferencedError(error)) {
    respondError(res, 409, "El registro tiene datos asociados y no se puede borrar");
    return;
  }

  logger.error(`${req.method} ${req.originalUrl}`, error);
  respondError(res, 500, "Error interno del servidor");
};
