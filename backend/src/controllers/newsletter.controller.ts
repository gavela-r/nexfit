// controllers/newsletter.controller.ts
import type { Request, Response } from "express";
import * as service from "../services/newsletter.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

/** POST /api/newsletter/subscribe */
export async function subscribe(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email?: unknown };

  if (typeof email !== "string") {
    throw ApiError.badRequest("Falta el campo email");
  }

  const { subscriber, alreadySubscribed } = await service.subscribe(email);

  respond(
    res,
    {
      subscriber,
      alreadySubscribed,
      message: alreadySubscribed
        ? "Ya estabas suscrito al Club NEXFIT"
        : "¡Bienvenido al Club NEXFIT!",
    },
    alreadySubscribed ? 200 : 201,
  );
}

/** GET /api/newsletter/stats */
export async function stats(_req: Request, res: Response): Promise<void> {
  respond(res, { subscribers: await service.countSubscribers() });
}
