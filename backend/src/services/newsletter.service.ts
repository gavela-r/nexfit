// services/newsletter.service.ts
// Suscripciones al Club NEXFIT persistidas en MySQL (newsletter_subscribers).
import type { RowDataPacket } from "mysql2";
import { run, rows } from "../db/pool";
import { isDuplicateEntry } from "../db/errors";
import type { NewsletterSubscriber } from "../types/product";
import { ApiError } from "../utils/ApiError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface SubscriberRow extends RowDataPacket {
  email: string;
  subscribed_at: Date | string;
}

function toSubscriber(row: SubscriberRow): NewsletterSubscriber {
  return {
    email: row.email,
    subscribedAt: new Date(row.subscribed_at).toISOString(),
  };
}

async function findByEmail(email: string): Promise<SubscriberRow | undefined> {
  const [row] = await rows<SubscriberRow>(
    "SELECT email, subscribed_at FROM newsletter_subscribers WHERE email = ? LIMIT 1",
    [email],
  );
  return row;
}

export async function subscribe(rawEmail: string): Promise<{
  subscriber: NewsletterSubscriber;
  alreadySubscribed: boolean;
}> {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    throw ApiError.badRequest("El correo electrónico es obligatorio");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest(`"${email}" no es un correo válido`);
  }

  const existing = await findByEmail(email);
  if (existing) {
    return { subscriber: toSubscriber(existing), alreadySubscribed: true };
  }

  try {
    await run("INSERT INTO newsletter_subscribers (email, source) VALUES (?, 'web')", [email]);
  } catch (error) {
    // Otra petición simultánea lo insertó primero: no es un error para el usuario.
    if (!isDuplicateEntry(error)) throw error;
  }

  const saved = await findByEmail(email);
  if (!saved) {
    throw ApiError.badRequest("No se pudo guardar la suscripción, inténtalo de nuevo");
  }

  return { subscriber: toSubscriber(saved), alreadySubscribed: false };
}

export async function countSubscribers(): Promise<number> {
  const [row] = await rows<RowDataPacket & { total: number }>(
    "SELECT COUNT(*) AS total FROM newsletter_subscribers",
  );
  return Number(row?.total ?? 0);
}
