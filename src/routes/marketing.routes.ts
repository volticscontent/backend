import { Router } from "express";
import { MarketingController } from "../controllers/MarketingController";
import { ensureClient } from "../middlewares/authMiddleware";

const router = Router();
const marketingController = new MarketingController();

// Protected routes (for client dashboard)
router.get("/settings", ensureClient, marketingController.getSettings);
router.post("/settings", ensureClient, marketingController.updateSettings);

// OAuth Routes
router.get("/auth/meta/url", ensureClient, marketingController.getMetaAuthUrl);
router.get("/auth/meta/callback", marketingController.handleMetaCallback); // Public callback (Meta calls this)
router.post("/auth/meta/token", ensureClient, marketingController.saveMetaToken);
router.get("/auth/meta/ad-accounts", ensureClient, marketingController.getAdAccounts); // Deprecated: Use /ad-accounts
router.get("/ad-accounts", ensureClient, marketingController.getAdAccounts);

// Public routes (for the pixel script and event tracking)
router.get("/pixel.js/:clientId", marketingController.getPixelScript);
router.post("/events/:clientId", marketingController.trackEvent);

export { router as marketingRoutes };
