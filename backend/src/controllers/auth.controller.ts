// controllers/auth.controller.ts
import type { Request, Response } from "express";
import * as service from "../services/auth.service";
import { ApiError } from "../utils/ApiError";
import { respond } from "../utils/respond";

const BEARER_PREFIX = "Bearer ";

/** Token del cabecero Authorization: «Bearer <token>». */
function readBearerToken(req: Request): string | undefined {
  const header = req.header("authorization") ?? "";
  return header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : undefined;
}

interface CredentialsBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

/** POST /api/auth/register */
export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as CredentialsBody;

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir name, email y password");
  }

  respond(res, service.register({ name, email, password }), 201);
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as CredentialsBody;

  if (typeof email !== "string" || typeof password !== "string") {
    throw ApiError.badRequest("El cuerpo debe incluir email y password");
  }

  respond(res, service.login(email, password));
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response): Promise<void> {
  respond(res, { loggedOut: service.logout(readBearerToken(req)) });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  respond(res, service.getUserByToken(readBearerToken(req)));
}
