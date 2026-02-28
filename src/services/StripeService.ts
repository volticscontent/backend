import Stripe from 'stripe';
import prisma from '../lib/prisma';
import { TrackingService } from './TrackingService';
import { DataSourceService } from './DataSourceService';
import { ProductService } from './ProductService';

export class StripeService {
  private trackingService = new TrackingService();
  private dataSourceService = new DataSourceService();
  private productService = new ProductService();

  private async getClient(slug: string) {
    const user = await prisma.user.findUnique({
      where: { slug }
    });
    if (!user) throw new Error('Client not found');
    return user;
  }

  private async getService(userId: string) {
    return prisma.service.findFirst({
      where: { userId },
      include: { checkoutSettings: true }
    });
  }

  async disconnect(slug: string) {
    const user = await this.getClient(slug);
    const cred = await prisma.credential.findFirst({
      where: { userId: user.id, serviceName: 'STRIPE' }
    });

    if (!cred) {
      throw new Error('Stripe not connected');
    }

    // If using Stripe Connect, we might want to deauthorize the account on Stripe's side too
    // But for now, we just remove the local credentials
    await prisma.credential.delete({
      where: { id: cred.id }
    });

    await prisma.dataSource.deleteMany({
      where: { userId: user.id, type: 'STRIPE' }
    });

    return { success: true };
  }

  private async getCredentials(userId: string) {
    const cred = await prisma.credential.findFirst({
      where: { userId, serviceName: 'STRIPE' }
    });

    if (!cred || !cred.apiSecret) {
      throw new Error('Stripe credentials not found');
    }

    return cred;
  }

  private async getStripeClient(userId: string) {
    const cred = await this.getCredentials(userId);

    // Check if it's a Connect account (starts with acct_)
    if (cred.apiKey.startsWith('acct_')) {
      return new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-12-18.acacia' as any,
        stripeAccount: cred.apiKey,
      });
    }

    // Legacy/Direct keys
    return new Stripe(cred.apiSecret!, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  getOAuthUrl(slug: string) {
    const state = slug; // Pass slug as state to know who is connecting
    const clientId = process.env.STRIPE_CLIENT_ID;
    const apiUrl = process.env.API_URL || 'http://localhost:3001';
    const redirectUri = `${apiUrl}/api/stripe/callback`;

    if (!clientId) throw new Error('STRIPE_CLIENT_ID not configured');

    return `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  }

  async authorize(code: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    return response;
  }

  async saveConnectCredentials(slug: string, stripeUserId: string, accessToken?: string) {
    const user = await this.getClient(slug);

    // Check if exists
    const existing = await prisma.credential.findFirst({
      where: { userId: user.id, serviceName: 'STRIPE' }
    });

    const data = {
      userId: user.id,
      serviceName: 'STRIPE',
      apiKey: stripeUserId, // Store account ID here
      apiSecret: accessToken, // Store access token (optional for standard, but good to have)
      meta: {
        connected: true,
        connectedAt: new Date().toISOString(),
        paymentMethods: ['card'] // Default methods (Pix must be enabled manually)
      }
    };

    if (existing) {
      await prisma.credential.update({
        where: { id: existing.id },
        data: {
          apiKey: stripeUserId,
          apiSecret: accessToken,
          meta: {
            ...existing.meta as object,
            ...data.meta
          }
        }
      });
    } else {
      await prisma.credential.create({
        data
      });
    }

    await this.ensureStripeDataSource(user.id, stripeUserId);
    await this.ensureTrackingSource(user.id, true);

    return { success: true };
  }

  private async ensureStripeDataSource(userId: string, accountId: string) {
    const existing = await prisma.dataSource.findFirst({
      where: {
        userId,
        type: 'STRIPE'
      }
    });

    if (!existing) {
      // Find default dataset to link for tracking events
      const dataset = await prisma.trackingDataset.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      await this.dataSourceService.createDataSource(userId, {
        name: 'Stripe Integration',
        type: 'STRIPE',
        integrationId: accountId,
        status: 'ACTIVE',
        config: { datasetId: dataset?.id }
      });
    } else if (!existing.config || !(existing.config as any).datasetId) {
      // Update existing if missing datasetId
      const dataset = await prisma.trackingDataset.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (dataset) {
        await prisma.dataSource.update({
          where: { id: existing.id },
          data: {
            config: { ...(existing.config as object), datasetId: dataset.id }
          }
        });
      }
    }
  }

  async saveSettings(slug: string, data: { publishableKey: string; secretKey: string; paymentMethods?: string[]; branding?: any; createDataSource?: boolean }) {
    const user = await this.getClient(slug);

    // Validate keys with a test call (optional but recommended)
    // Only validate if secretKey is provided (it might be masked or empty if not changing)
    if (data.secretKey && !data.secretKey.includes('••••')) {
      try {
        const testStripe = new Stripe(data.secretKey, { apiVersion: '2024-12-18.acacia' as any });
        await testStripe.balance.retrieve();
      } catch (e) {
        throw new Error('Invalid Stripe Secret Key');
      }
    }

    // Check if exists
    const existing = await prisma.credential.findFirst({
      where: { userId: user.id, serviceName: 'STRIPE' }
    });

    if (existing) {
      await prisma.credential.update({
        where: { id: existing.id },
        data: {
          apiKey: data.publishableKey || existing.apiKey,
          apiSecret: (data.secretKey && !data.secretKey.includes('••••')) ? data.secretKey : existing.apiSecret,
          meta: {
            ...((existing.meta as object) || {}),
            paymentMethods: data.paymentMethods || (existing.meta as any)?.paymentMethods || ['card'],
            branding: data.branding || (existing.meta as any)?.branding
          }
        }
      });
    } else {
      await prisma.credential.create({
        data: {
          userId: user.id,
          serviceName: 'STRIPE',
          apiKey: data.publishableKey,
          apiSecret: data.secretKey,
          meta: {
            paymentMethods: data.paymentMethods || ['card'],
            branding: data.branding
          }
        }
      });
    }

    // Auto-link Tracking/DataSource
    // Ensure the main Stripe DataSource exists
    const cred = await prisma.credential.findFirst({ where: { userId: user.id, serviceName: 'STRIPE' } });
    if (cred) {
      await this.ensureStripeDataSource(user.id, cred.apiKey || 'manual');
    }

    // Ensure the Tracking Source exists (but don't create a separate DataSource for it, as we have the main one)
    await this.ensureTrackingSource(user.id, false);

    return { success: true };
  }

  private async ensureTrackingSource(userId: string, createDataSource: boolean = false) {
    try {
      // Check if Stripe Tracking Source exists
      const existingSource = await prisma.trackingSource.findFirst({
        where: {
          dataset: { userId },
          type: 'WEBHOOK',
          provider: 'STRIPE'
        }
      });

      if (!existingSource) {
        // Get or create default dataset
        let dataset = await prisma.trackingDataset.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' }
        });

        if (!dataset) {
          dataset = await this.trackingService.createDataset(userId, 'Stripe Dataset', 'Auto-created for Stripe');
        }

        // Add Source (This triggers DataSource creation via TrackingService)
        await this.trackingService.addSource(
          userId,
          dataset.id,
          'WEBHOOK',
          'Stripe Checkout',
          'STRIPE',
          { autoCreated: true },
          createDataSource
        );
      }
    } catch (error) {
      console.error('Failed to auto-create Stripe Tracking Source:', error);
    }
  }

  async getSettings(slug: string) {
    const user = await this.getClient(slug);
    const service = await this.getService(user.id);
    const cred = await prisma.credential.findFirst({
      where: { userId: user.id, serviceName: 'STRIPE' }
    });

    if (!cred) return null;

    const isConnect = cred.apiKey.startsWith('acct_');

    return {
      isConnected: true,
      isConnectAccount: isConnect,
      publishableKey: isConnect ? process.env.STRIPE_PUBLISHABLE_KEY : cred.apiKey,
      accountId: isConnect ? cred.apiKey : null,
      secretKey: cred.apiSecret ? '••••••••' + cred.apiSecret.slice(-4) : null,
      paymentMethods: (cred.meta as any)?.paymentMethods || (service?.checkoutSettings as any)?.paymentMethods || ['card'],
      branding: (cred.meta as any)?.branding || (service?.checkoutSettings as any)?.branding || { primaryColor: '#000000', logoUrl: '' }
    };
  }

  // Templates
  async syncCmsProductToStripe(slug: string, productId: string) {
    const user = await this.getClient(slug);
    return this.syncProduct(user, productId);
  }

  async syncCmsProductToStripeByUserId(userId: string, productId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return this.syncProduct(user, productId);
  }

  private async syncProduct(user: any, productId: string) {
    const stripe = await this.getStripeClient(user.id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.userId !== user.id) {
      throw new Error('Produto não encontrado ou sem permissão');
    }

    // Criar ou atualizar produto no Stripe
    let stripeProductId = (product.variants as any)?.stripeProductId;
    let stripePriceId = (product.variants as any)?.stripePriceId;

    if (!stripeProductId) {
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        images: product.image ? [product.image] : [],
        metadata: {
          localProductId: product.id,
          source: 'cms',
        },
      });
      stripeProductId = stripeProduct.id;

      const stripePrice = await stripe.prices.create({
        product: stripeProductId,
        unit_amount: Math.round(Number(product.price) * 100),
        currency: 'brl',
      });
      stripePriceId = stripePrice.id;
    } else {
      await stripe.products.update(stripeProductId, {
        name: product.name,
        description: product.description || undefined,
        images: product.image ? [product.image] : [],
      });
      
      // Se o preço mudou, idealmente criaríamos um novo preço, 
      // mas para simplificar aqui vamos apenas manter o atual se existir
      if (!stripePriceId) {
        const stripePrice = await stripe.prices.create({
          product: stripeProductId,
          unit_amount: Math.round(Number(product.price) * 100),
          currency: 'brl',
        });
        stripePriceId = stripePrice.id;
      }
    }

    // Atualizar produto local com IDs do Stripe
    return prisma.product.update({
      where: { id: productId },
      data: {
        variants: {
          ...(product.variants as any || {}),
          stripeProductId,
          stripePriceId,
        },
      },
    });
  }

  async listTemplates(slug: string) {
    const user = await this.getClient(slug);
    const service = await this.getService(user.id);
    
    if (!service) return [];

    return prisma.checkoutTemplate.findMany({
      where: { serviceId: service.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveTemplate(slug: string, data: any) {
    const user = await this.getClient(slug);
    const service = await this.getService(user.id);
    
    if (!service) throw new Error('Service not found');

    const { id, name, type, isDefault, config } = data;

    if (id) {
      // Update
      if (isDefault) {
        await prisma.checkoutTemplate.updateMany({
          where: { serviceId: service.id },
          data: { isDefault: false }
        });
      }

      return prisma.checkoutTemplate.update({
        where: { id },
        data: { name, type, isDefault, config }
      });
    } else {
      // Create
      if (isDefault) {
        await prisma.checkoutTemplate.updateMany({
          where: { serviceId: service.id },
          data: { isDefault: false }
        });
      }

      return prisma.checkoutTemplate.create({
        data: {
          name,
          type,
          isDefault,
          config,
          serviceId: service.id
        }
      });
    }
  }

  async deleteTemplate(id: string) {
    return prisma.checkoutTemplate.delete({
      where: { id }
    });
  }

  async createPreviewSession(slug: string, type: string = 'EMBEDDED') {
    const user = await this.getClient(slug);
    const stripe = await this.getStripeClient(user.id);
    const cred = await this.getCredentials(user.id);
    const branding = (cred.meta as any)?.branding;

    // Get allowed payment methods from credentials
    const allowedPaymentMethods = (cred.meta as any)?.paymentMethods || ['card'];

    if (type === 'ELEMENTS') {
      // For Elements, we need a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 150000, // R$ 1.500,00
        currency: 'brl',
        payment_method_types: allowedPaymentMethods,
        description: 'Produto de Teste (Preview Elements)',
      });
      return { clientSecret: paymentIntent.client_secret };
    }

    if (type === 'HOSTED') {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        payment_method_types: allowedPaymentMethods,
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: 'Produto de Teste (Preview Hosted)',
                description: 'Este é um produto de exemplo para visualização do checkout padrão da Stripe.',
                images: branding?.logoUrl ? [branding.logoUrl] : undefined,
              },
              unit_amount: 150000, // R$ 1.500,00
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      return { url: session.url };
    }

    // Default to EMBEDDED Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: 'embedded',
      mode: 'payment',
      payment_method_types: allowedPaymentMethods,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Produto de Teste (Preview)',
              description: 'Este é um produto de exemplo para visualização do checkout.',
              images: branding?.logoUrl ? [branding.logoUrl] : undefined,
            },
            unit_amount: 150000, // R$ 1.500,00
          },
          quantity: 1,
        },
      ],
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/return?session_id={CHECKOUT_SESSION_ID}`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { clientSecret: session.client_secret };
  }

  async createCheckoutSession(slug: string, data: { priceId?: string; quantity?: number; successUrl: string; cancelUrl: string; allowPromotionCodes?: boolean }) {
    const user = await this.getClient(slug);
    const stripe = await this.getStripeClient(user.id);
    const cred = await this.getCredentials(user.id);
    const isConnect = cred.apiKey.startsWith('acct_');

    // Default application fee (e.g., 10%)
    // Only applicable if using Stripe Connect
    const applicationFeePercent = 0.10;

    // If we don't have a priceId, we might need to create a line item on the fly
    // For now, let's assume priceId is passed or we handle it
    if (!data.priceId) throw new Error('Price ID is required');

    // Fetch price to calculate fee
    // Note: If using Connect, the price must exist on the connected account
    const price = await stripe.prices.retrieve(data.priceId);
    const unitAmount = price.unit_amount || 0;
    const applicationFeeAmount = isConnect ? Math.round(unitAmount * (data.quantity || 1) * applicationFeePercent) : undefined;

    // Get allowed payment methods from credentials
    const allowedPaymentMethods = (cred.meta as any)?.paymentMethods || ['card'];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: allowedPaymentMethods,
      line_items: [
        {
          price: data.priceId,
          quantity: data.quantity || 1,
        },
      ],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      allow_promotion_codes: data.allowPromotionCodes,
    };

    if (isConnect && applicationFeeAmount && applicationFeeAmount > 0) {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  }

  async listProducts(slug: string) {
    const user = await this.getClient(slug);
    const stripe = await this.getStripeClient(user.id);

    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ['data.default_price']
    });

    return products.data.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images[0] || null,
      active: p.active,
      price: p.default_price ? (p.default_price as Stripe.Price).unit_amount : 0,
      currency: p.default_price ? (p.default_price as Stripe.Price).currency : 'brl',
      updatedAt: p.updated * 1000
    }));
  }

  async createProduct(slug: string, data: { name: string; description?: string; price: number; currency?: string; image?: string }) {
    const user = await this.getClient(slug);
    // @ts-ignore
    const stripe = await this.getStripeClient(user.id);

    const stripeProduct = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: data.image ? [data.image] : undefined,
      default_price_data: {
        currency: data.currency || 'brl',
        unit_amount: Math.round(data.price * 100),
      },
    });

    // Create local product for unified resolver
    const stripePriceId = typeof stripeProduct.default_price === 'string'
      ? stripeProduct.default_price
      : (stripeProduct.default_price as any)?.id;

    await this.productService.create(user.id, {
      name: data.name,
      description: data.description || '',
      price: data.price,
      currency: (data.currency || 'brl').toUpperCase(),
      image: data.image,
      source: 'STRIPE',
      tags: ['stripe'],
      active: stripeProduct.active,
      variants: {
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePriceId,
      },
    });

    return stripeProduct;
  }
}
