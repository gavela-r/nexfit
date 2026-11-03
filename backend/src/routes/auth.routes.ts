// routes/auth.routes.ts
import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  me,
  register,
  updateMe,
  updateSizes,
} from "../controllers/auth.controller";
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

/** PATCH /api/auth/me  { name, email } */
authRouter.patch("/auth/me", asyncHandler(updateMe));

/** POST /api/auth/password  { currentPassword, newPassword } */
authRouter.post("/auth/password", asyncHandler(changePassword));

/** PATCH /api/auth/sizes  { top, bottom, shoe } */
authRouter.patch("/auth/sizes", asyncHandler(updateSizes));
