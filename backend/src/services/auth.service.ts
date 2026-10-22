// services/auth.service.ts
// Registro, inicio de sesión y sesiones en memoria (demo).
// En producción se sustituiría por una base de datos y tokens firmados sin
// cambiar la interfaz de este servicio.
import { randomBytes } from "node:crypto";
import type { AuthPayload, UserRecord, UserView } from "../types/user";
import { ApiError } from "../utils/ApiError";
import { hashPassword, verifyPassword } from "../utils/password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_NAME_LENGTH = 2;
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_BYTES = 32;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

const usersById = new Map<string, UserRecord>();
const userIdByEmail = new Map<string, string>();
const userIdByToken = new Map<string, string>();

/** Vista pública: jamás se devuelve el hash de la contraseña. */
function toView(user: UserRecord): UserView {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createSession(userId: string): string {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  userIdByToken.set(token, userId);
  return token;
}

/** Crea la cuenta (409 si el correo ya está registrado) e inicia sesión. */
export function register(input: RegisterInput): AuthPayload {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  const problems: string[] = [];
  if (name.length < MIN_NAME_LENGTH) {
    problems.push(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`);
  }
  if (!EMAIL_PATTERN.test(email)) {
    problems.push(`"${input.email.trim()}" no es un correo válido`);
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    problems.push(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
  }
  if (problems.length > 0) {
    throw ApiError.badRequest("Revisa los datos del formulario", problems);
  }

  if (userIdByEmail.has(email)) {
    throw ApiError.conflict(`Ya existe una cuenta con el correo "${email}"`);
  }

  const user: UserRecord = {
    id: `usr-${randomBytes(4).toString("hex")}`,
    name,
    email,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(input.password),
  };

  usersById.set(user.id, user);
  userIdByEmail.set(email, user.id);

  return { user: toView(user), token: createSession(user.id) };
}

/** Valida credenciales (401 si no coinciden) e inicia sesión. */
export function login(email: string, password: string): AuthPayload {
  const user = usersById.get(userIdByEmail.get(email.trim().toLowerCase()) ?? "");

  // El mismo mensaje sirve para «correo inexistente» y para «contraseña
  // incorrecta», así no se revela qué correos tienen cuenta.
  const invalidCredentials = ApiError.unauthorized("El correo o la contraseña no son correctos");

  if (!user) throw invalidCredentials;
  if (!verifyPassword(password, user.passwordHash)) throw invalidCredentials;

  return { user: toView(user), token: createSession(user.id) };
}

/** Cierra la sesión del token (devuelve false si el token ya no existía). */
export function logout(token?: string): boolean {
  return token ? userIdByToken.delete(token) : false;
}

/** Usuario de la sesión abierta; lanza 401 si el token no es válido. */
export function getUserByToken(token?: string): UserView {
  const userId = token ? userIdByToken.get(token) : undefined;
  const user = userId ? usersById.get(userId) : undefined;
  if (!user) throw ApiError.unauthorized("No hay sesión iniciada");
  return toView(user);
}

/** Cuentas creadas desde que arrancó el servidor. */
export function countUsers(): number {
  return usersById.size;
}
