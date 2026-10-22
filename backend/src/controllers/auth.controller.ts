// controllers/auth.controller.ts
import type { Request, Response } from "express";
import { readBearerToken } from "../middlewares/auth";
import * as service from "../services/auth.service";
import { mergeGuestCart } from "../services/cart.service";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { respond } from "../utils/respond";

interface CredentialsBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  /** Token del carrito de invitado, para no perder las líneas al entrar. */
  cartToken?: unknown;
}

/** Fusión del carrito de invitado sin romper el acceso si algo fallara. */
async function tryMergeGuestCart(cartToken: unknown, userId: string): Promise<void> {
  if (typeof cartToken !== "string" || cartToken.length === 0) return;

  try {
    await mergeGuestCart(cartToken, userId);
  } catch (error) {
    logger.warn("No se pudo fusionar el carrito de invitado", error);
  }
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, cartToken } = req.body as CredentialsBody;

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir name, email y password");
  }

  const session = await service.register({ name, email, password });
  await tryMergeGuestCart(cartToken, session.user.id);

  respond(res, session, 201);
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, cartToken } = req.body as CredentialsBody;

  if (typeof email !== "string" || typeof password !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir email y password");
  }

  const session = await service.login(email, password);
  await tryMergeGuestCart(cartToken, session.user.id);

  respond(res, session);
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response): Promise<void> {
  respond(res, { loggedOut: await service.logout(readBearerToken(req)) });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  respond(res, await service.getUserByToken(readBearerToken(req)));
}
