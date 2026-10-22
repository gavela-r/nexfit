// routes/health.routes.ts
import { Router } from "express";
import { health } from "../controllers/health.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(health));
