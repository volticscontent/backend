import { Router } from "express";
import { CampaignController } from "../controllers/CampaignController";
import { ensureClient } from "../middlewares/authMiddleware";

const router = Router();
const campaignController = new CampaignController();

// Service Campaigns
router.get("/services/:serviceId/campaigns", ensureClient, campaignController.getCampaigns);
router.post("/services/:serviceId/campaigns", ensureClient, campaignController.createCampaign);

// Individual Campaign Operations
router.get("/campaigns/:id", ensureClient, campaignController.getCampaign);
router.put("/campaigns/:id", ensureClient, campaignController.updateCampaign);
router.delete("/campaigns/:id", ensureClient, campaignController.deleteCampaign);

export { router as campaignRoutes };
