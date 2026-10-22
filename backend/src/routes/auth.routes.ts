// routes/auth.routes.ts
import { Router } from "express";
import { login, logout, me, register } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const authRouter = Router();

/** POST /api/auth/register */
authRouter.post("/auth/register", asyncHandler(register));

/** POST /api/auth/login */
authRouter.post("/auth/login", asyncHandler(login));

/** POST /api/auth/logout */
authRouter.post("/auth/logout", asyncHandler(logout));

/** GET /api/auth/me */
authRouter.get("/auth/me", asyncHandler(me));
