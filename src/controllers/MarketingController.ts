import { Request, Response } from "express";
import { MarketingService } from "../services/MarketingService";

const marketingService = new MarketingService();

export class MarketingController {
  async getSettings(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const settings = await marketingService.getSettings(userId);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateSettings(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { metaPixelId, metaApiToken } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const settings = await marketingService.updateSettings(userId, metaPixelId, metaApiToken);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getPixelScript(req: Request, res: Response) {
    const { clientId } = req.params;
    
    try {
      const settings = await marketingService.getSettings(clientId as string);
      if (!settings?.metaPixelId) {
        return res.status(404).send("// No pixel configured");
      }

      // Determine the proxy endpoint
      const protocol = req.protocol;
      const host = req.get('host');
      const endpointUrl = `${protocol}://${host}/api/marketing/events/${clientId}`;

      const script = marketingService.generatePixelScript(settings.metaPixelId, endpointUrl);
      
      res.setHeader('Content-Type', 'application/javascript');
      return res.send(script);
    } catch (error) {
      return res.status(500).send("// Error generating pixel");
    }
  }

  async trackEvent(req: Request, res: Response) {
    const { clientId } = req.params;
    const { sync } = req.query; // Check for sync mode
    const eventData = req.body;
    const clientIp = req.ip || req.socket.remoteAddress || '';

    try {
      if (sync === 'true') {
        // Wait for CAPI response and return it
        await marketingService.sendToCAPI(clientId as string, eventData, clientIp as string);
        return res.json({ status: "success", mode: "sync" });
      } else {
        // Fire and forget - don't block response
        marketingService.sendToCAPI(clientId as string, eventData, clientIp as string).catch(console.error);
        return res.json({ status: "success", mode: "async" });
      }
    } catch (error) {
      console.error("Tracking error:", error);
      return res.status(500).json({ error: "Tracking error", details: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
