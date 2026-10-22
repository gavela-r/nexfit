// utils/asyncHandler.ts
// Evita try/catch repetidos en los controladores: las promesas rechazadas
// pasan directamente al middleware de errores.
import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(handler: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}
