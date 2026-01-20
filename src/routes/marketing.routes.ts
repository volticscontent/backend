import { Router } from "express";
import { MarketingController } from "../controllers/MarketingController";
import { ensureClient } from "../middlewares/authMiddleware";

const router = Router();
const marketingController = new MarketingController();

// Protected routes (for client dashboard)
router.get("/settings", ensureClient, marketingController.getSettings);
router.post("/settings", ensureClient, marketingController.updateSettings);

// Public routes (for the pixel script and event tracking)
router.get("/pixel.js/:clientId", marketingController.getPixelScript);
router.post("/events/:clientId", marketingController.trackEvent);

export { router as marketingRoutes };
