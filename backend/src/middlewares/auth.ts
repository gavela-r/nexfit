// middlewares/auth.ts
// Lectura del token Bearer y resolución del usuario de la sesión.
import type { Request } from "express";
import { getUserByToken } from "../services/auth.service";
import type { UserView } from "../types/user";
import { ApiError } from "../utils/ApiError";

const BEARER_PREFIX = "Bearer ";

/** Token del cabecero Authorization: «Bearer <token>». */
export function readBearerToken(req: Request): string | undefined {
  const header = req.header("authorization") ?? "";
  return header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length).trim() : undefined;
}

/**
 * Usuario de la sesión, o null si no hay token.
 * Un token caducado se trata como invitado (el frontend limpia la sesión con
 * /auth/me); así el catálogo y el carrito de invitado siguen funcionando.
 */
export async function optionalUser(req: Request): Promise<UserView | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  try {
    return await getUserByToken(token);
  } catch {
    return null;
  }
}

/** Exige sesión válida: 401 si falta el token o ya no sirve. */
export async function requireUser(req: Request): Promise<UserView> {
  const token = readBearerToken(req);
  if (!token) {
    throw ApiError.unauthorized("Inicia sesión para continuar");
  }
  return getUserByToken(token);
}
