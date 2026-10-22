// controllers/health.controller.ts
import type { Request, Response } from "express";
import { respond } from "../utils/respond";

const startedAt = Date.now();

/** GET /api/health */
export async function health(_req: Request, res: Response): Promise<void> {
  respond(res, {
    status: "ok",
    service: "nexfit-api",
    version: "1.0.0",
    uptime: Number(process.uptime().toFixed(3)),
    timestamp: new Date().toISOString(),
    uptimeMs: Date.now() - startedAt,
  });
}
