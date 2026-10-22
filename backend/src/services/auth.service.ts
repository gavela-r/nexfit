// services/auth.service.ts
// Registro, inicio de sesión y sesiones persistidas en MySQL.
//   · users    → cuentas (password_hash con scrypt, nunca en claro)
//   · sessions → token Bearer de 32 bytes en hexadecimal
import { randomBytes } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { run, rows } from "../db/pool";
import { isDuplicateEntry } from "../db/errors";
import type { AuthPayload, UserView } from "../types/user";
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

interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date | string;
}

interface SessionUserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
  expires_at: Date | string | null;
}

/** Vista pública: jamás se devuelve el hash de la contraseña. */
function toView(row: {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
}): UserView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/** Crea el token de sesión y lo guarda en la tabla sessions. */
async function createSession(userId: string): Promise<string> {
  const token = randomBytes(TOKEN_BYTES).toString("hex");
  await run("INSERT INTO sessions (token, user_id) VALUES (?, ?)", [token, userId]);
  return token;
}

/** Crea la cuenta (409 si el correo ya está registrado) e inicia sesión. */
export async function register(input: RegisterInput): Promise<AuthPayload> {
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

  const user = {
    id: `usr-${randomBytes(4).toString("hex")}`,
    name,
    email,
    passwordHash: hashPassword(input.password),
  };

  try {
    await run("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)", [
      user.id,
      user.name,
      user.email,
      user.passwordHash,
    ]);
  } catch (error) {
    // La columna email es UNIQUE (y la colación no distingue mayúsculas).
    if (isDuplicateEntry(error)) {
      throw ApiError.conflict(`Ya existe una cuenta con el correo "${email}"`);
    }
    throw error;
  }

  return { user: toView({ ...user, created_at: new Date() }), token: await createSession(user.id) };
}

/** Valida credenciales (401 si no coinciden) e inicia sesión. */
export async function login(email: string, password: string): Promise<AuthPayload> {
  const [user] = await rows<UserRow>(
    `SELECT id, name, email, password_hash, created_at
       FROM users
      WHERE email = ? AND is_active = 1
      LIMIT 1`,
    [email.trim().toLowerCase()],
  );

  // El mismo mensaje sirve para «correo inexistente» y para «contraseña
  // incorrecta», así no se revela qué correos tienen cuenta.
  const invalidCredentials = ApiError.unauthorized("El correo o la contraseña no son correctos");

  if (!user) throw invalidCredentials;
  if (!verifyPassword(password, user.password_hash)) throw invalidCredentials;

  return { user: toView(user), token: await createSession(user.id) };
}

/** Cierra la sesión del token (devuelve false si el token ya no existía). */
export async function logout(token?: string): Promise<boolean> {
  if (!token) return false;
  const result = await run("DELETE FROM sessions WHERE token = ?", [token]);
  return result.affectedRows > 0;
}

/** Usuario de la sesión abierta; lanza 401 si el token no es válido. */
export async function getUserByToken(token?: string): Promise<UserView> {
  if (!token) throw ApiError.unauthorized("No hay sesión iniciada");

  const [session] = await rows<SessionUserRow>(
    `SELECT u.id, u.name, u.email, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.token = ? AND u.is_active = 1
      LIMIT 1`,
    [token],
  );

  if (!session) throw ApiError.unauthorized("No hay sesión iniciada");

  if (session.expires_at && new Date(session.expires_at).getTime() < Date.now()) {
    await run("DELETE FROM sessions WHERE token = ?", [token]);
    throw ApiError.unauthorized("La sesión ha caducado");
  }

  await run("UPDATE sessions SET last_used_at = NOW() WHERE token = ?", [token]);
  return toView(session);
}

/** Cuentas registradas en la base de datos. */
export async function countUsers(): Promise<number> {
  const [row] = await rows<RowDataPacket & { total: number }>(
    "SELECT COUNT(*) AS total FROM users",
  );
  return Number(row?.total ?? 0);
}
