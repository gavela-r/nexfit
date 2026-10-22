// controllers/health.controller.ts
import type { Request, Response } from "express";
import { ping } from "../db/pool";
import { respond, respondError } from "../utils/respond";

const startedAt = Date.now();

/** GET /api/health · estado del servicio y de la base de datos. */
export async function health(_req: Request, res: Response): Promise<void> {
  const base = {
    service: "nexfit-api",
    version: "1.0.0",
    uptime: Number(process.uptime().toFixed(3)),
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now() - startedAt,
  };

  try {
    await ping();
    respond(res, { ...base, status: "ok", db: "ok" });
  } catch {
    respondError(res, 503, "La base de datos no responde");
  }
}
