import { Router } from "express";
import { SeoController } from "../controllers/SeoController";
import { ensureClient } from "../middlewares/authMiddleware";

const router = Router();
const seoController = new SeoController();

router.use(ensureClient);

router.get("/settings", seoController.getSettings);
router.put("/settings", seoController.updateSettings);

export { router as seoRoutes };
