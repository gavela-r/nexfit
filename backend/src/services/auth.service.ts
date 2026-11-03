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

/** Columnas de la talla habitual (pueden estar vacías). */
interface SizeColumns {
  size_top?: string | null;
  size_bottom?: string | null;
  size_shoe?: string | null;
}

interface UserRow extends RowDataPacket, SizeColumns {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date | string;
}

interface SessionUserRow extends RowDataPacket, SizeColumns {
  id: string;
  name: string;
  email: string;
  created_at: Date | string;
  expires_at: Date | string | null;
}

/** Tallas que se pueden guardar en el perfil. */
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];

/** Vista pública: jamás se devuelve el hash de la contraseña. */
function toView(
  row: { id: string; name: string; email: string; created_at: Date | string } & SizeColumns,
): UserView {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: new Date(row.created_at).toISOString(),
    sizes: {
      top: row.size_top ?? null,
      bottom: row.size_bottom ?? null,
      shoe: row.size_shoe ?? null,
    },
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
    `SELECT id, name, email, password_hash, created_at, size_top, size_bottom, size_shoe
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
    `SELECT u.id, u.name, u.email, u.created_at, u.size_top, u.size_bottom, u.size_shoe, s.expires_at
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

/** Cambia el nombre y el correo de la cuenta (409 si el correo ya es de otra). */
export async function updateProfile(
  userId: string,
  input: { name: string; email: string },
): Promise<UserView> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  const problems: string[] = [];
  if (name.length < MIN_NAME_LENGTH) {
    problems.push(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`);
  }
  if (name.length > 80) problems.push("El nombre no puede superar los 80 caracteres");
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    problems.push(`"${input.email.trim()}" no es un correo válido`);
  }
  if (problems.length > 0) {
    throw ApiError.badRequest("Revisa los datos del formulario", problems);
  }

  try {
    await run("UPDATE users SET name = ?, email = ? WHERE id = ? AND is_active = 1", [
      name,
      email,
      userId,
    ]);
  } catch (error) {
    if (isDuplicateEntry(error)) {
      throw ApiError.conflict(`Ya existe una cuenta con el correo "${email}"`);
    }
    throw error;
  }

  const [user] = await rows<UserRow>(
    "SELECT id, name, email, password_hash, created_at, size_top, size_bottom, size_shoe FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!user) throw ApiError.notFound("La cuenta ya no existe");
  return toView(user);
}

/**
 * Cambia la contraseña comprobando antes la actual. Cierra el resto de
 * sesiones abiertas (otros dispositivos) y mantiene la del token actual.
 */
export async function changePassword(
  userId: string,
  currentToken: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const [user] = await rows<UserRow>(
    "SELECT id, name, email, password_hash, created_at, size_top, size_bottom, size_shoe FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!user || !verifyPassword(currentPassword, user.password_hash)) {
    throw ApiError.badRequest("La contraseña actual no es correcta", [
      "La contraseña actual no es correcta",
    ]);
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest("Revisa los datos del formulario", [
      `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
    ]);
  }
  if (newPassword === currentPassword) {
    throw ApiError.badRequest("Revisa los datos del formulario", [
      "La nueva contraseña debe ser distinta de la actual",
    ]);
  }

  await run("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(newPassword), userId]);
  await run("DELETE FROM sessions WHERE user_id = ? AND token <> ?", [userId, currentToken]);
}

/** Guarda la talla habitual (null = sin indicar). Devuelve el perfil actualizado. */
export async function updateSizes(
  userId: string,
  sizes: { top: string | null; bottom: string | null; shoe: string | null },
): Promise<UserView> {
  const problems: string[] = [];
  if (sizes.top && !CLOTHING_SIZES.includes(sizes.top)) problems.push("Talla de arriba no válida");
  if (sizes.bottom && !CLOTHING_SIZES.includes(sizes.bottom))
    problems.push("Talla de abajo no válida");
  if (sizes.shoe && !SHOE_SIZES.includes(sizes.shoe)) problems.push("Número de calzado no válido");
  if (problems.length > 0) throw ApiError.badRequest("Revisa las tallas", problems);

  await run("UPDATE users SET size_top = ?, size_bottom = ?, size_shoe = ? WHERE id = ?", [
    sizes.top || null,
    sizes.bottom || null,
    sizes.shoe || null,
    userId,
  ]);

  const [user] = await rows<UserRow>(
    "SELECT id, name, email, password_hash, created_at, size_top, size_bottom, size_shoe FROM users WHERE id = ? LIMIT 1",
    [userId],
  );
  if (!user) throw ApiError.notFound("La cuenta ya no existe");
  return toView(user);
}

/** Cuentas registradas en la base de datos. */
export async function countUsers(): Promise<number> {
  const [row] = await rows<RowDataPacket & { total: number }>(
    "SELECT COUNT(*) AS total FROM users",
  );
  return Number(row?.total ?? 0);
}
