import prisma from '../lib/prisma';
import { ProductService } from './ProductService';

export class CmsProductService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create a new Product from CMS source.
   * Automatically adds 'cms' tag and sets source to 'CMS'.
   * Allows flexible variants structure.
   */
  async create(userId: string, data: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    sku?: string;
    image?: string;
    variants?: any;
    active?: boolean;
  }) {
    const productData = {
      ...data,
      source: 'CMS',
      tags: ['cms'],
      // Ensure variants is valid JSON if provided
      variants: data.variants || undefined
    };

    return this.productService.create(userId, productData);
  }

  /**
   * Update a CMS product.
   * Preserves the 'cms' tag.
   */
  async update(userId: string, productId: string, data: {
    name?: string;
    description?: string;
    price?: number;
    variants?: any;
    active?: boolean;
  }) {
    return this.productService.update(productId, userId, data);
  }

  /**
   * List only CMS products.
   */
  async list(userId: string) {
    return prisma.product.findMany({
      where: { 
        userId,
        source: 'CMS' 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get a single CMS product.
   */
  async get(userId: string, productId: string) {
    return prisma.product.findFirst({
      where: { 
        id: productId, 
        userId,
        source: 'CMS'
      }
    });
  }

  async syncProductFromCms(userId: string, entry: any, data: any) {
    // Check if product already exists (linked by CMS Entry ID in tags)
    console.log(`[CmsProductService] Syncing product from CMS Entry ID: ${entry.id}`);
    const existingProduct = await prisma.product.findFirst({
        where: {
            userId,
            tags: { has: `cms:${entry.id}` }
        }
    });
    
    console.log(`[CmsProductService] Existing product found: ${!!existingProduct}`);

    const name = data.name || data.title || data.titulo || 'Produto CMS';
    
    // Helper to parse price/number allowing for comma/dot
    const parsePrice = (val: any) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const strVal = String(val).replace(',', '.');
        const num = parseFloat(strVal);
        return isNaN(num) ? 0 : num;
    };

    const price = parsePrice(data.price || data.valor || data.preco);
    const currency = data.currency || data.moeda || 'BRL';
    const description = data.description || '';
    const image = data.image || '';
    const sku = data.sku || '';

    if (existingProduct) {
        // Update existing product
        return prisma.product.update({
            where: { id: existingProduct.id },
            data: {
                name,
                price,
                currency,
                description,
                image: image || existingProduct.image,
                sku: sku || existingProduct.sku,
                variants: { ...data, cmsEntryId: entry.id }
            }
        });
    } else {
        // Create new product
        console.log(`[CmsProductService] Creating new product`);
        return prisma.product.create({
            data: {
                name,
                price,
                currency,
                description,
                image,
                sku,
                userId,
                source: 'CMS',
                tags: ['cms', `cms:${entry.id}`],
                variants: { ...data, cmsEntryId: entry.id }
            }
        });
    }
  }
}
