// utils/logger.ts
// Registro mínimo y sin dependencias externas, con nivel según NODE_ENV.
const isTest = process.env.NODE_ENV === "test";

export const logger = {
  info(message: string, meta?: unknown): void {
    if (isTest) return;
    console.log(`[nexfit] ${message}`, meta ?? "");
  },
  warn(message: string, meta?: unknown): void {
    if (isTest) return;
    console.warn(`[nexfit] ${message}`, meta ?? "");
  },
  error(message: string, meta?: unknown): void {
    if (isTest) return;
    console.error(`[nexfit] ${message}`, meta ?? "");
  },
};
