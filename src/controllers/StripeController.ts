import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';

export class StripeController {
  constructor(private stripeService: StripeService) {}

  disconnect = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      await this.stripeService.disconnect(clientSlug as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  getSettings = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const settings = await this.stripeService.getSettings(clientSlug as string);
      res.json(settings || { isConnected: false });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  saveSettings = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const { publishableKey, secretKey, paymentMethods, branding, createDataSource } = req.body;
      
      if (!publishableKey && !secretKey && !paymentMethods && !branding && createDataSource === undefined) {
        return res.status(400).json({ error: 'No settings provided' });
      }

      await this.stripeService.saveSettings(clientSlug as string, { publishableKey, secretKey, paymentMethods, branding, createDataSource });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  createPreviewSession = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const { type } = req.query;
      const session = await this.stripeService.createPreviewSession(clientSlug as string, type as string);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // Connect / OAuth
  getConnectUrl = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const url = this.stripeService.getOAuthUrl(clientSlug as string);
      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  connectCallback = async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state) {
        return res.status(400).send('Missing code or state');
      }

      const clientSlug = state as string;
      const response = await this.stripeService.authorize(code as string);

      if (!response.stripe_user_id) {
        throw new Error('Stripe user ID not returned');
      }

      await this.stripeService.saveConnectCredentials(clientSlug, response.stripe_user_id, response.access_token);

      // Redirect back to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://demo.localhost:3000';
      
      // Try to parse state to get returnUrl
      try {
        const stateObj = JSON.parse(clientSlug);
        if (stateObj.returnUrl) {
           return res.redirect(`${frontendUrl}${stateObj.returnUrl}`);
        }
      } catch (e) {
        // Fallback if state is just a string
      }

      // Default fallback: Redirect to the dashboard root for the client
      // The previous path /client/:slug/services might be wrong if "services" route doesn't exist directly
      // Based on file structure: /client/[slug] exists (page.tsx under (dashboard))
      res.redirect(`${frontendUrl}`); 
    } catch (error: any) {
      console.error('Stripe Connect Error:', error);
      res.status(500).send('Error connecting Stripe account');
    }
  }

  // Templates
  listTemplates = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const templates = await this.stripeService.listTemplates(clientSlug as string);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  saveTemplate = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const template = await this.stripeService.saveTemplate(clientSlug as string, req.body);
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  deleteTemplate = async (req: Request, res: Response) => {
    try {
      const { templateId } = req.params;
      await this.stripeService.deleteTemplate(templateId as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  listProducts = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const products = await this.stripeService.listProducts(clientSlug as string);
      res.json(products);
    } catch (error: any) {
      if (error.message === 'Stripe credentials not found') {
        return res.status(400).json({ error: 'Stripe not connected' });
      }
      res.status(500).json({ error: error.message });
    }
  }

  createProduct = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const { name, description, price, image } = req.body;
      
      const product = await this.stripeService.createProduct(clientSlug as string, { name, description, price, image });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  createCheckoutSession = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const { priceId, successUrl, cancelUrl, quantity } = req.body;
      
      if (!priceId || !successUrl || !cancelUrl) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const session = await this.stripeService.createCheckoutSession(clientSlug as string, { 
        priceId, 
        successUrl, 
        cancelUrl,
        quantity: quantity || 1
      });
      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  syncCmsProduct = async (req: Request, res: Response) => {
    const { clientSlug } = req.params;
    const { productId } = req.body;
    console.log(`[StripeController] syncCmsProduct called - Slug: ${clientSlug}, ProductID: ${productId}`);
    
    try {
      const result = await this.stripeService.syncCmsProductToStripe(clientSlug as string, productId);
      res.json(result);
    } catch (error: any) {
      console.error(`[StripeController] Error in syncCmsProduct: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  }
}
