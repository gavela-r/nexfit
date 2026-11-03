// routes/account.routes.ts
import { Router } from "express";
import {
  createAddress,
  createReturn,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  deleteReview,
  listCoupons,
  listReturns,
  myReviews,
  saveReview,
  validateCoupon,
} from "../controllers/account.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const accountRouter = Router();

/** GET /api/returns */
accountRouter.get("/returns", asyncHandler(listReturns));

/** POST /api/returns */
accountRouter.post("/returns", asyncHandler(createReturn));

/** GET /api/reviews/mine */
accountRouter.get("/reviews/mine", asyncHandler(myReviews));

/** POST /api/reviews */
accountRouter.post("/reviews", asyncHandler(saveReview));

/** DELETE /api/reviews/:productId */
accountRouter.delete("/reviews/:productId", asyncHandler(deleteReview));

/** GET /api/coupons */
accountRouter.get("/coupons", asyncHandler(listCoupons));

/** POST /api/coupons/validate  { code } */
accountRouter.post("/coupons/validate", asyncHandler(validateCoupon));

/** GET /api/addresses */
accountRouter.get("/addresses", asyncHandler(listAddresses));

/** POST /api/addresses */
accountRouter.post("/addresses", asyncHandler(createAddress));

/** PATCH /api/addresses/:id */
accountRouter.patch("/addresses/:id", asyncHandler(updateAddress));

/** DELETE /api/addresses/:id */
accountRouter.delete("/addresses/:id", asyncHandler(deleteAddress));

/** POST /api/addresses/:id/default */
accountRouter.post("/addresses/:id/default", asyncHandler(setDefaultAddress));
