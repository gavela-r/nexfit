// services/newsletter.service.ts
// Suscripciones al Club NEXFIT (almacén en memoria).
import type { NewsletterSubscriber } from "../types/product";
import { ApiError } from "../utils/ApiError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const subscribers = new Map<string, NewsletterSubscriber>();

export function subscribe(rawEmail: string): {
  subscriber: NewsletterSubscriber;
  alreadySubscribed: boolean;
} {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    throw ApiError.badRequest("El correo electrónico es obligatorio");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest(`"${email}" no es un correo válido`);
  }

  const existing = subscribers.get(email);
  if (existing) {
    return { subscriber: existing, alreadySubscribed: true };
  }

  const subscriber: NewsletterSubscriber = {
    email,
    subscribedAt: new Date().toISOString(),
  };
  subscribers.set(email, subscriber);

  return { subscriber, alreadySubscribed: false };
}

export function countSubscribers(): number {
  return subscribers.size;
}
