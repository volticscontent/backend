import prisma from '../lib/prisma';
import Stripe from 'stripe';

export class ProductService {
  async list(userId: string) {
    return prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Unified listing for the Products resolver.
   * Returns all products with normalized data and source labels, 
   * regardless of origin (CMS, Stripe, Manual).
   */
  async listUnified(userId: string) {
    const products = await prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return products.map(p => {
      const variants = p.variants as any;
      return {
        ...p,
        price: Number(p.price),
        sourceLabel: p.source === 'CMS' ? 'CMS'
          : p.source === 'STRIPE' ? 'Stripe'
            : 'Manual',
        stripeProductId: variants?.stripeProductId || null,
        stripePriceId: variants?.stripePriceId || null,
      };
    });
  }

  async create(userId: string, data: any) {
    // Validate required fields
    if (!data.name) throw new Error("Name is required");
    if (data.price === undefined || data.price === null) throw new Error("Price is required");

    const product = await prisma.product.create({
      data: {
        userId,
        name: data.name,
        price: data.price,
        description: data.description,
        image: data.image,
        sku: data.sku,
        currency: data.currency,
        variants: data.variants || undefined,
        active: data.active !== undefined ? data.active : true,
        source: data.source,
        tags: data.tags
      }
    });

    // Auto-create/ensure DataSource for Products
    await this.ensureProductDataSource(userId);

    return product;
  }

  private async ensureProductDataSource(userId: string) {
    const existing = await prisma.dataSource.findFirst({
      where: {
        userId,
        type: 'PRODUCT'
      }
    });

    if (!existing) {
      await prisma.dataSource.create({
        data: {
          userId,
          name: 'Produtos (Interno)',
          type: 'PRODUCT',
          status: 'ACTIVE'
        }
      });
    }
  }

  async update(id: string, userId: string, data: any) {
    const updatedProduct = await prisma.product.update({
      where: { id, userId },
      data
    });

    // Sync back to Stripe if product originated from Stripe
    if (updatedProduct.source === 'STRIPE') {
      await this.syncToStripe(userId, updatedProduct);
    }

    return updatedProduct;
  }

  /**
   * Syncs local product changes back to the Stripe API.
   * Only updates name, description and images — price changes require
   * Stripe Price object management which is more complex.
   */
  private async syncToStripe(userId: string, product: any) {
    try {
      const variants = product.variants as any;
      const stripeProductId = variants?.stripeProductId;
      if (!stripeProductId) return;

      // Get Stripe credentials
      const cred = await prisma.credential.findFirst({
        where: { userId, serviceName: 'STRIPE' }
      });
      if (!cred?.apiSecret) return;

      // Create Stripe client (handle Connect vs Direct)
      const stripe = cred.apiKey.startsWith('acct_')
        ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-12-18.acacia' as any,
          stripeAccount: cred.apiKey,
        })
        : new Stripe(cred.apiSecret, {
          apiVersion: '2024-12-18.acacia' as any,
        });

      await stripe.products.update(stripeProductId, {
        name: product.name,
        description: product.description || undefined,
        images: product.image ? [product.image] : undefined,
        active: product.active,
      });

      console.log(`[ProductService] Synced product ${product.id} back to Stripe (${stripeProductId})`);
    } catch (error) {
      // Log but don't fail the local update
      console.error(`[ProductService] Failed to sync product to Stripe:`, error);
    }
  }

  async delete(id: string, userId: string) {
    return prisma.product.delete({
      where: { id, userId }
    });
  }

  async get(id: string, userId: string) {
    return prisma.product.findUnique({
      where: { id, userId }
    });
  }
}
