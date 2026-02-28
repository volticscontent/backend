import { Request, Response } from "express";
import { CampaignService } from "../services/CampaignService";

const campaignService = new CampaignService();

export class CampaignController {

  async createCampaign(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { serviceId } = req.params;
    const { name, description, status } = req.body;

    try {
      const campaign = await campaignService.createCampaign(userId, serviceId as string, { name, description, status });
      return res.status(201).json(campaign);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to create campaign" });
    }
  }

  async getCampaigns(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { serviceId } = req.params;

    try {
      const campaigns = await campaignService.getCampaigns(userId, serviceId as string);
      return res.json(campaigns);
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  }

  async getCampaign(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;

    try {
      const campaign = await campaignService.getCampaignById(userId, id as string);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      return res.json(campaign);
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch campaign" });
    }
  }

  async updateCampaign(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, description, status } = req.body;

    try {
      const campaign = await campaignService.updateCampaign(userId, id as string, { name, description, status });
      return res.json(campaign);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update campaign" });
    }
  }

  async deleteCampaign(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;

    try {
      await campaignService.deleteCampaign(userId, id as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to delete campaign" });
    }
  }
}
