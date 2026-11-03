// routes/order.routes.ts
// El webhook no está aquí: necesita el cuerpo sin parsear y se monta en app.ts
// antes de express.json().
import { Router } from "express";
import { confirm, createSession, list } from "../controllers/order.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const orderRouter = Router();

/** POST /api/checkout/session */
orderRouter.post("/checkout/session", asyncHandler(createSession));

/** POST /api/checkout/confirm  { sessionId } */
orderRouter.post("/checkout/confirm", asyncHandler(confirm));

/** GET /api/orders */
orderRouter.get("/orders", asyncHandler(list));
