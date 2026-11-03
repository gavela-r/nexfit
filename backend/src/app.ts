// app.ts
// Configuración de la aplicación Express: middlewares, API y estáticos.
import { existsSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type Express, type RequestHandler } from "express";
import { env } from "./config/env";
import { webhook as stripeWebhook } from "./controllers/order.controller";
import { asyncHandler } from "./utils/asyncHandler";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/requestLogger";
import { apiRouter } from "./routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  // El webhook de Stripe verifica la firma sobre el cuerpo original, así que
  // va antes de express.json() y recibe los bytes tal cual.
  app.post(
    "/api/checkout/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    asyncHandler(stripeWebhook),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(requestLogger);

  // ------------------------------------------------------------- API REST
  app.use("/api", apiRouter);
  app.use("/api", notFoundHandler);

  // ------------------------------------------------ Frontend compilado
  // Si existe frontend/dist, el backend también sirve la SPA (modo producción).
  const distPath = path.resolve(__dirname, env.frontendDist);
  if (existsSync(distPath)) {
    app.use(express.static(distPath));

    const spaFallback: RequestHandler = (_req, res, next) => {
      res.sendFile(path.join(distPath, "index.html"), (error) => {
        if (error) next(error);
      });
    };
    app.get("*", spaFallback);
  }

  app.use(errorHandler);

  return app;
}
