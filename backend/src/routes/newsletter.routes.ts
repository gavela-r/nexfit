// routes/newsletter.routes.ts
import { Router } from "express";
import { stats, subscribe } from "../controllers/newsletter.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const newsletterRouter = Router();

/** POST /api/newsletter/subscribe */
newsletterRouter.post("/newsletter/subscribe", asyncHandler(subscribe));

/** GET /api/newsletter/stats */
newsletterRouter.get("/newsletter/stats", asyncHandler(stats));
