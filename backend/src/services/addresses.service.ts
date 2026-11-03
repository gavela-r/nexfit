// services/addresses.service.ts
// Direcciones de envío guardadas (tabla user_addresses).
//   · Hasta MAX_ADDRESSES por cuenta; siempre hay una predeterminada si existe alguna.
//   · La predeterminada rellena el formulario de pago de Stripe.
//   · Tras el primer pago, la dirección usada se guarda sola (saveFromCheckout).
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { inTransaction, rows } from "../db/pool";
import { ApiError } from "../utils/ApiError";

const MAX_ADDRESSES = 5;
const COUNTRIES = ["ES", "PT"];
/** Códigos postales: España 5 dígitos, Portugal 0000-000. */
const POSTAL_CODE: Record<string, RegExp> = { ES: /^\d{5}$/, PT: /^\d{4}-\d{3}$/ };

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string | null;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string | null;
  fullName: string;
  phone?: string | null;
  addressLine: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface AddressRow extends RowDataPacket {
  id: number;
  label: string | null;
  full_name: string;
  phone: string | null;
  address_line: string;
  city: string;
  postal_code: string;
  country: string;
  is_default: number;
}

function toAddress(row: AddressRow): Address {
  return {
    id: Number(row.id),
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    postalCode: row.postal_code,
    country: row.country,
    isDefault: Number(row.is_default) === 1,
  };
}

/** Limpia y valida los datos del formulario (400 con la lista de problemas). */
function clean(input: AddressInput): Required<Omit<AddressInput, "isDefault">> {
  const value = {
    label: input.label?.trim().slice(0, 40) || null,
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    addressLine: input.addressLine.trim(),
    city: input.city.trim(),
    postalCode: input.postalCode.trim().toUpperCase(),
    country: input.country.trim().toUpperCase(),
  };

  const problems: string[] = [];
  if (value.fullName.length < 2 || value.fullName.length > 80)
    problems.push("Indica el nombre de quien recibe el pedido");
  if (value.addressLine.length < 5 || value.addressLine.length > 160)
    problems.push("Escribe la dirección completa (calle, número, piso)");
  if (value.city.length < 2 || value.city.length > 80) problems.push("Indica la ciudad");
  if (!COUNTRIES.includes(value.country)) problems.push("Solo enviamos a España y Portugal");
  else if (!POSTAL_CODE[value.country].test(value.postalCode)) {
    problems.push(
      value.country === "ES"
        ? "El código postal debe tener 5 dígitos"
        : "El código postal debe ser 0000-000",
    );
  }
  if (value.phone && !/^\+?[\d\s-]{6,20}$/.test(value.phone))
    problems.push("El teléfono no es válido");
  if (problems.length > 0) throw ApiError.badRequest("Revisa la dirección", problems);
  return value;
}

/** Direcciones del usuario: la predeterminada primero. */
export async function listAddresses(userId: string): Promise<Address[]> {
  const list = await rows<AddressRow>(
    "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at, id",
    [userId],
  );
  return list.map(toAddress);
}

/** La predeterminada (o null si no tiene ninguna). */
export async function getDefaultAddress(userId: string): Promise<Address | null> {
  const [row] = await rows<AddressRow>(
    "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at, id LIMIT 1",
    [userId],
  );
  return row ? toAddress(row) : null;
}

/** Deja una sola predeterminada: la indicada. */
async function makeDefault(conn: PoolConnection, userId: string, id: number): Promise<void> {
  await conn.query("UPDATE user_addresses SET is_default = (id = ?) WHERE user_id = ?", [
    id,
    userId,
  ]);
}

/** Si no queda ninguna predeterminada, pasa a serlo la más antigua. */
async function ensureDefault(conn: PoolConnection, userId: string): Promise<void> {
  const [found] = await conn.query<RowDataPacket[]>(
    "SELECT id, is_default FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at, id LIMIT 1",
    [userId],
  );
  const first = found[0];
  if (first && Number(first.is_default) !== 1) await makeDefault(conn, userId, Number(first.id));
}

export async function createAddress(userId: string, input: AddressInput): Promise<Address[]> {
  const value = clean(input);
  await inTransaction(async (conn) => {
    const [count] = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM user_addresses WHERE user_id = ? FOR UPDATE",
      [userId],
    );
    if (Number(count[0]?.total ?? 0) >= MAX_ADDRESSES) {
      throw ApiError.badRequest(`Puedes guardar hasta ${MAX_ADDRESSES} direcciones`);
    }
    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO user_addresses (user_id, label, full_name, phone, address_line, city, postal_code, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        value.label,
        value.fullName,
        value.phone,
        value.addressLine,
        value.city,
        value.postalCode,
        value.country,
      ],
    );
    if (input.isDefault) await makeDefault(conn, userId, Number(result.insertId));
    await ensureDefault(conn, userId);
  });
  return listAddresses(userId);
}

export async function updateAddress(
  userId: string,
  id: number,
  input: AddressInput,
): Promise<Address[]> {
  const value = clean(input);
  await inTransaction(async (conn) => {
    const [result] = await conn.query<ResultSetHeader>(
      `UPDATE user_addresses
          SET label = ?, full_name = ?, phone = ?, address_line = ?, city = ?, postal_code = ?, country = ?
        WHERE id = ? AND user_id = ?`,
      [
        value.label,
        value.fullName,
        value.phone,
        value.addressLine,
        value.city,
        value.postalCode,
        value.country,
        id,
        userId,
      ],
    );
    if (result.affectedRows === 0) throw ApiError.notFound("Dirección no encontrada");
    if (input.isDefault) await makeDefault(conn, userId, id);
  });
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, id: number): Promise<Address[]> {
  await inTransaction(async (conn) => {
    const [result] = await conn.query<ResultSetHeader>(
      "DELETE FROM user_addresses WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    if (result.affectedRows === 0) throw ApiError.notFound("Dirección no encontrada");
    await ensureDefault(conn, userId);
  });
  return listAddresses(userId);
}

export async function setDefaultAddress(userId: string, id: number): Promise<Address[]> {
  await inTransaction(async (conn) => {
    const [found] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
      [id, userId],
    );
    if (found.length === 0) throw ApiError.notFound("Dirección no encontrada");
    await makeDefault(conn, userId, id);
  });
  return listAddresses(userId);
}

/**
 * Tras un pago: si la cuenta aún no tiene direcciones, guarda como
 * predeterminada la que se usó en Stripe. Nunca rompe la confirmación del pedido.
 */
export async function saveFromCheckout(
  conn: PoolConnection,
  userId: string,
  address: {
    fullName: string | null;
    phone: string | null;
    addressLine: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  },
): Promise<void> {
  if (!address.addressLine || !address.city || !address.postalCode) return;
  const country = (address.country ?? "ES").toUpperCase();
  if (!COUNTRIES.includes(country)) return;

  const [existing] = await conn.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM user_addresses WHERE user_id = ?",
    [userId],
  );
  if (Number(existing[0]?.total ?? 0) > 0) return;

  await conn.query(
    `INSERT INTO user_addresses (user_id, label, full_name, phone, address_line, city, postal_code, country, is_default)
     VALUES (?, 'Principal', ?, ?, ?, ?, ?, ?, 1)`,
    [
      userId,
      (address.fullName ?? "Cliente NEXFIT").slice(0, 80),
      address.phone?.slice(0, 25) ?? null,
      address.addressLine.slice(0, 160),
      address.city.slice(0, 80),
      address.postalCode.slice(0, 12),
      country,
    ],
  );
}
