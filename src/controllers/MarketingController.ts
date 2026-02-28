import { Request, Response } from "express";
import { MarketingService } from "../services/MarketingService";
import { MetaAdsService } from "../services/MetaAdsService";

const marketingService = new MarketingService();
const metaAdsService = new MetaAdsService();

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
    const data = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      const settings = await marketingService.updateSettings(userId, data);
      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getMetaAuthUrl(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Construct redirect URI based on request host
    const protocol = req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/marketing/auth/meta/callback`;
    
    // Pass userId as state to identify user in callback
    const state = userId;

    const url = metaAdsService.getAuthUrl(redirectUri, state);
    return res.json({ url });
  }

  async handleMetaCallback(req: Request, res: Response) {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send("Missing code or state");
    }

    const userId = state as string;
    const protocol = req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/api/marketing/auth/meta/callback`;

    try {
      const accessToken = await metaAdsService.exchangeCodeForToken(code as string, redirectUri);
      
      // Update user's marketing settings with the new token
      await marketingService.updateSettings(userId, {
        metaApiToken: accessToken
      });

      // Redirect back to the frontend (campaigns page)
      // Ideally this should be dynamic or env configured, but for now defaulting to the campaigns page
      // We might need to know the Service ID to redirect back to specific service campaigns,
      // but 'state' only holds userId. 
      // For now, redirect to a success page or the dashboard.
      // Assuming frontend runs on port 3000 in dev.
      // Better: redirect to a generic "connection success" page in frontend that closes the popup or redirects.
      
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/client/dashboard?connection=success&platform=meta`);

    } catch (error) {
      console.error("Meta callback error:", error);
      return res.status(500).send("Failed to connect Meta Ads");
    }
  }

  async saveMetaToken(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { token } = req.body;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!token) return res.status(400).json({ error: "Token is required" });

    try {
      await marketingService.saveMetaToken(userId, token);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error saving Meta token:", error);
      return res.status(500).json({ error: "Failed to save token" });
    }
  }

  async getAdAccounts(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { platform } = req.query;
    const token = req.headers['x-platform-token'] as string | undefined;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      let accounts;
      if (platform === 'tiktok') {
          accounts = await marketingService.getTikTokAdAccounts(userId, token);
      } else if (platform === 'google') {
          accounts = await marketingService.getGoogleAdAccounts(userId, token);
      } else {
          // Default to Meta
          accounts = await marketingService.getAdAccounts(userId, token);
      }
      return res.json(accounts);
    } catch (error: any) {
      console.error("Error fetching ad accounts:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch ad accounts" });
    }
  }

  async getPixelScript(req: Request, res: Response) {
    const { clientId } = req.params;
    
    try {
      const settings = await marketingService.getSettings(clientId as string);
      if (!settings) {
        return res.status(404).send("// No settings found");
      }

      // Determine the proxy endpoint
      const protocol = req.protocol;
      const host = req.get('host');
      const endpointUrl = `${protocol}://${host}/api/marketing/events/${clientId}`;

      const script = marketingService.generatePixelScript(settings, endpointUrl);
      
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
