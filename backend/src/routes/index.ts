// routes/index.ts
// Agrupa todos los routers de la API bajo /api.
import { Router } from "express";
import { authRouter } from "./auth.routes";
import { cartRouter } from "./cart.routes";
import { favoritesRouter } from "./favorites.routes";
import { healthRouter } from "./health.routes";
import { newsletterRouter } from "./newsletter.routes";
import { productRouter } from "./product.routes";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(productRouter);
apiRouter.use(cartRouter);
apiRouter.use(favoritesRouter);
apiRouter.use(newsletterRouter);
