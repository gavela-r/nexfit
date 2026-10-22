// utils/respond.ts
// Forma única de responder en la API: { ok: true, data } / { ok: false, error }.
import type { Response } from "express";
import type { ApiErrorBody, ApiResponse } from "../types/http";

export function respond<T>(res: Response, data: T, status = 200): Response {
  const body: ApiResponse<T> = { ok: true, data };
  return res.status(status).json(body);
}

export function respondError(
  res: Response,
  status: number,
  error: string,
  details?: string[],
): Response {
  const body: ApiErrorBody = details ? { ok: false, error, details } : { ok: false, error };
  return res.status(status).json(body);
}
