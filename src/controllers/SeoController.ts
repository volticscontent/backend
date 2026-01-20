import { Request, Response } from "express";
import { SeoService } from "../services/SeoService";

export class SeoController {
  private seoService: SeoService;

  constructor() {
    this.seoService = new SeoService();
  }

  getSettings = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const settings = await this.seoService.getSettings(userId);
      return res.json(settings);
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      return res.status(500).json({ error: "Failed to fetch SEO settings" });
    }
  };

  updateSettings = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const data = req.body;
      const settings = await this.seoService.updateSettings(userId, data);
      return res.json(settings);
    } catch (error) {
      console.error("Error updating SEO settings:", error);
      return res.status(500).json({ error: "Failed to update SEO settings" });
    }
  };
}
