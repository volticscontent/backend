import prisma from "../lib/prisma";
import { DataSourceService } from "./DataSourceService";
import { CmsProductService } from "./CmsProductService";
import { StripeService } from "./StripeService";

export class CmsService {
    private dataSourceService: DataSourceService;
    private cmsProductService: CmsProductService;
    private stripeService: StripeService;

    constructor() {
        this.dataSourceService = new DataSourceService();
        this.cmsProductService = new CmsProductService();
        this.stripeService = new StripeService();
    }

    // Content Types
    async createContentType(userId: string, data: any) {
        // Generate slug from name if not provided
        let slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        if (!slug) {
            slug = `type-${Date.now()}`;
        }

        // If resolver is 'products', ensure default fields are present
        let fields = data.fields || [];
        if (data.resolver === 'products') {
            const productFields = [
                { key: 'name', label: 'Nome do Produto', type: 'text', required: true },
                { key: 'price', label: 'Preço', type: 'number', required: true },
                { key: 'description', label: 'Descrição', type: 'rich-text', required: false },
                { key: 'image', label: 'Imagem Principal', type: 'image', required: false },
                { key: 'sku', label: 'SKU', type: 'text', required: false },
                { key: 'active', label: 'Ativo', type: 'boolean', required: false },
            ];

            // Merge provided fields with default product fields (avoid duplicates by key)
            const existingKeys = new Set(fields.map((f: any) => f.key));
            productFields.forEach(pf => {
                if (!existingKeys.has(pf.key)) {
                    fields.unshift(pf);
                }
            });
        }

        const contentType = await prisma.cmsContentType.create({
            data: {
                userId,
                name: data.name,
                slug,
                fields: fields,
                description: data.description,
                resolver: data.resolver || 'standard'
            }
        });

        // Always ensure DataSource exists for CMS Content Types
        await this.ensureCmsDataSource(userId, contentType.id, contentType.name);

        return contentType;
    }

    async listContentTypes(userId: string) {
        return prisma.cmsContentType.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getContentType(userId: string, id: string) {
        return prisma.cmsContentType.findFirst({
            where: { id, userId }
        });
    }

    async updateContentType(userId: string, id: string, data: any) {
        let fields = data.fields;

        // If resolver is 'products', ensure default fields are present
        if (data.resolver === 'products' && fields) {
            const productFields = [
                { key: 'name', label: 'Nome do Produto', type: 'text', required: true },
                { key: 'price', label: 'Preço', type: 'number', required: true },
                { key: 'description', label: 'Descrição', type: 'rich-text', required: false },
                { key: 'image', label: 'Imagem Principal', type: 'image', required: false },
                { key: 'sku', label: 'SKU', type: 'text', required: false },
                { key: 'active', label: 'Ativo', type: 'boolean', required: false },
            ];

            const existingKeys = new Set(fields.map((f: any) => f.key));
            productFields.forEach(pf => {
                if (!existingKeys.has(pf.key)) {
                    fields.unshift(pf);
                }
            });
        }

        const contentType = await prisma.cmsContentType.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                fields: fields,
                description: data.description,
                resolver: data.resolver
            }
        });

        if (data.name) {
            const dataSource = await prisma.dataSource.findFirst({
                where: { userId, type: 'CMS', integrationId: id }
            });
            if (dataSource) {
                await prisma.dataSource.update({
                    where: { id: dataSource.id },
                    data: { name: `CMS: ${data.name}` }
                });
            }
        }

        // Always ensure DataSource exists/is updated
        await this.ensureCmsDataSource(userId, id, contentType.name);

        return contentType;
    }

    async deleteContentType(userId: string, id: string) {
        const contentType = await prisma.cmsContentType.delete({
            where: { id }
        });

        await prisma.dataSource.deleteMany({
            where: { userId, type: 'CMS', integrationId: id }
        });

        return contentType;
    }

    private async ensureCmsDataSource(userId: string, contentTypeId: string, name: string) {
        const existing = await prisma.dataSource.findFirst({
            where: {
                userId,
                type: 'CMS',
                integrationId: contentTypeId
            }
        });

        if (!existing) {
            await this.dataSourceService.createDataSource(userId, {
                name: `CMS: ${name}`,
                type: 'CMS',
                integrationId: contentTypeId
            });
        }
    }

    // Content Entries
    async createContentEntry(userId: string, contentTypeId: string, data: any, status: string = 'DRAFT', slug?: string) {
        const contentType = await prisma.cmsContentType.findFirst({
            where: { id: contentTypeId, userId }
        });

        if (!contentType) throw new Error("Content Type not found");

        // Auto-generate slug if not provided
        let finalSlug = slug;
        if (!finalSlug) {
            const title = data.name || data.title || data.titulo || Object.values(data)[0] || 'untitled';
            finalSlug = String(title).toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
                .replace(/^-+|-+$/g, ''); // trim dashes

            // Append random string to ensure uniqueness if needed, or rely on catch
            finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
        }

        const entry = await prisma.cmsContentEntry.create({
            data: {
                contentTypeId,
                data,
                status,
                slug: finalSlug
            }
        });

        // Handle Resolvers
        if (contentType.resolver === 'products' && status === 'PUBLISHED') {
            console.log(`[CmsService] Syncing product from CMS entry ${entry.id}`);
            try {
                // Create or Update Product
                const product = await this.cmsProductService.syncProductFromCms(userId, entry, data);
                console.log(`[CmsService] Product synced locally: ${product.id}`);
                
                // Sync to Stripe
                try {
                    await this.stripeService.syncCmsProductToStripeByUserId(userId, product.id);
                    console.log(`[CmsService] Product synced to Stripe successfully`);
                } catch (stripeError: any) {
                    console.error(`[CmsService] Stripe sync failed (possibly not connected):`, stripeError.message);
                }
            } catch (error) {
                console.error(`[CmsService] Error syncing product:`, error);
            }
        }

        return entry;
    }

    async createContentEntryBySlug(userId: string, typeSlug: string, data: any, status: string = 'DRAFT', slug?: string) {
        const contentType = await prisma.cmsContentType.findFirst({
            where: { slug: typeSlug, userId }
        });

        if (!contentType) throw new Error("Content Type not found");

        const entry = await prisma.cmsContentEntry.create({
            data: {
                contentTypeId: contentType.id,
                data,
                status,
                slug: slug || undefined
            }
        });

        // Handle Resolvers
        if (contentType.resolver === 'products' && status === 'PUBLISHED') {
            console.log(`[CmsService] Syncing product from CMS entry ${entry.id} (slug creation)`);
            try {
                const product = await this.cmsProductService.syncProductFromCms(userId, entry, data);
                console.log(`[CmsService] Product synced locally: ${product.id}`);

                // Sync to Stripe
                try {
                    await this.stripeService.syncCmsProductToStripeByUserId(userId, product.id);
                    console.log(`[CmsService] Product synced to Stripe successfully`);
                } catch (stripeError: any) {
                    console.error(`[CmsService] Stripe sync failed:`, stripeError.message);
                }
            } catch (error) {
                console.error(`[CmsService] Error syncing product:`, error);
            }
        }

        return entry;
    }

    async listContentEntries(userId: string, typeId: string) {
        console.log(`[CmsService] Listing entries for type ${typeId} (User: ${userId})`);
        // Verify ownership via type check or trust the controller's flow.
        // Ideally check type.userId === userId.
        const type = await prisma.cmsContentType.findUnique({ where: { id: typeId } });
        if (!type || type.userId !== userId) throw new Error("Invalid content type");

        if (type.slug === 'products') {
            // 1. Get explicit CMS Entries (Drafts, Published, etc)
            const cmsEntries = await prisma.cmsContentEntry.findMany({
                where: { contentTypeId: typeId },
                orderBy: { createdAt: 'desc' }
            });

            // 2. Get all Products (including those created outside CMS)
            const allProducts = await prisma.product.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });

            // 3. Merge: Entries take precedence. Products without entries are added as virtual entries.
            const entryIds = new Set(cmsEntries.map(e => e.id));
            const combined = [...cmsEntries];

            for (const p of allProducts) {
                // Check if product is linked to an entry via tag 'cms:ENTRY_ID'
                const cmsTag = p.tags.find(t => t.startsWith('cms:'));
                const linkedEntryId = cmsTag ? cmsTag.split(':')[1] : null;

                // If product is linked to an existing entry, skip (entry is the source of truth)
                if (linkedEntryId && entryIds.has(linkedEntryId)) {
                    continue;
                }

                // Otherwise, map product to entry format
                combined.push({
                    id: p.id,
                    contentTypeId: typeId,
                    data: {
                        name: p.name,
                        description: p.description,
                        price: Number(p.price),
                        image: p.image,
                        sku: p.sku,
                        active: p.active,
                        ...(p.variants as object || {})
                    },
                    status: p.active ? 'PUBLISHED' : 'DRAFT',
                    slug: p.id,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                });
            }

            // Re-sort by date
            return combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }

        const entries = await prisma.cmsContentEntry.findMany({
            where: { contentTypeId: typeId },
            orderBy: { createdAt: 'desc' }
        });
        console.log(`[CmsService] Found ${entries.length} entries`);
        return entries;
    }

    async updateContentEntry(userId: string, entryId: string, data: any, status: string, slug?: string) {
        console.log(`[CmsService] updateContentEntry called with:`, { userId, entryId, status, slug });

        // Check ownership
        const entry = await prisma.cmsContentEntry.findUnique({
            where: { id: entryId },
            include: { contentType: true }
        });

        if (entry) {
            if (entry.contentType.userId !== userId) throw new Error("Entry not found");

            console.log(`[CmsService] Updating existing entry ${entryId} to status ${status}`);

            let finalSlug = slug || entry.slug;
            if (!finalSlug) {
                const title = data.name || data.title || data.titulo || Object.values(data)[0] || 'untitled';
                finalSlug = String(title).toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
            }

            const updatedEntry = await prisma.cmsContentEntry.update({
                where: { id: entryId },
                data: {
                    data,
                    status,
                    slug: finalSlug
                }
            });

            console.log(`[CmsService] Entry updated. New status: ${updatedEntry.status}`);

            if (entry.contentType.resolver === 'products' && status === 'PUBLISHED') {
                console.log(`[CmsService] Syncing product from CMS entry ${updatedEntry.id} (update)`);
                try {
                    const product = await this.cmsProductService.syncProductFromCms(userId, updatedEntry, data);
                    console.log(`[CmsService] Product synced locally: ${product.id}`);

                    // Sync to Stripe
                    try {
                        await this.stripeService.syncCmsProductToStripeByUserId(userId, product.id);
                        console.log(`[CmsService] Product synced to Stripe successfully`);
                    } catch (stripeError: any) {
                        console.error(`[CmsService] Stripe sync failed:`, stripeError.message);
                    }
                } catch (error) {
                    console.error(`[CmsService] Error syncing product:`, error);
                }
            }

            return updatedEntry;
        }

        // Try as Product
        const product = await this.cmsProductService.get(userId, entryId);
        if (product) {
            const productUpdateData: any = {
                name: data.name,
                description: data.description,
                price: data.price !== undefined ? Number(data.price) : undefined,
                variants: { ...data }
            };

            if (data.image) productUpdateData.image = data.image;
            if (data.sku) productUpdateData.sku = data.sku;
            if (status) productUpdateData.active = status === 'PUBLISHED';
            if (data.active !== undefined) productUpdateData.active = data.active;

            // Remove known keys
            delete productUpdateData.variants.name;
            delete productUpdateData.variants.description;
            delete productUpdateData.variants.price;
            delete productUpdateData.variants.image;
            delete productUpdateData.variants.sku;
            delete productUpdateData.variants.active;

            const updated = await this.cmsProductService.update(userId, entryId, productUpdateData);

            // Sync to Stripe if published
            if (updated.active) {
                try {
                    await this.stripeService.syncCmsProductToStripeByUserId(userId, updated.id);
                    console.log(`[CmsService] Virtual product synced to Stripe successfully`);
                } catch (stripeError: any) {
                    console.error(`[CmsService] Stripe sync failed for virtual product:`, stripeError.message);
                }
            }

            // Fetch the 'products' content type id for consistency
            const productType = await prisma.cmsContentType.findUnique({
                where: { userId_slug: { userId, slug: 'products' } }
            });

            return {
                id: updated.id,
                contentTypeId: productType?.id || '',
                data: {
                    ...(updated.variants as object || {}),
                    name: updated.name,
                    description: updated.description,
                    price: Number(updated.price),
                    image: updated.image,
                    sku: updated.sku,
                    active: updated.active
                },
                status: updated.active ? 'PUBLISHED' : 'DRAFT',
                slug: updated.id,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt
            };
        }

        throw new Error("Entry not found");
    }

    async deleteContentEntry(userId: string, entryId: string) {
        const entry = await prisma.cmsContentEntry.findUnique({
            where: { id: entryId },
            include: { contentType: true }
        });

        if (entry) {
            if (entry.contentType.userId !== userId) throw new Error("Entry not found");

            // Clean up linked Product (via tag 'cms:{entryId}')
            await prisma.product.deleteMany({
                where: {
                    userId,
                    tags: { has: `cms:${entryId}` }
                }
            });

            return prisma.cmsContentEntry.delete({
                where: { id: entryId }
            });
        }

        // Try as Product
        const product = await this.cmsProductService.get(userId, entryId);
        if (product) {
            // Verify it's a CMS product to allow deletion via CMS
            if (product.source !== 'CMS') throw new Error("Cannot delete non-CMS product via CMS");

            await prisma.product.delete({
                where: { id: entryId }
            });

            return { id: entryId };
        }

        throw new Error("Entry not found");
    }

    // Public/SDK
    async getPublicContent(clientSlug: string, typeSlug: string, entrySlug?: string) {
        // Find user by slug
        const user = await prisma.user.findUnique({ where: { slug: clientSlug } });
        if (!user) throw new Error("Client not found");

        if (typeSlug === 'products') {
            if (entrySlug) {
                // Get single product (assuming ID for now)
                const product = await prisma.product.findFirst({
                    where: {
                        userId: user.id,
                        id: entrySlug,
                        active: true
                    }
                });
                if (!product) throw new Error("Product not found");

                return {
                    id: product.id,
                    slug: product.id,
                    status: 'PUBLISHED',
                    data: {
                        ...(product.variants as object || {}),
                        name: product.name,
                        description: product.description,
                        price: Number(product.price),
                        image: product.image,
                        sku: product.sku
                    },
                    createdAt: product.createdAt,
                    updatedAt: product.updatedAt
                };
            } else {
                // List products
                const products = await prisma.product.findMany({
                    where: {
                        userId: user.id,
                        active: true
                    },
                    orderBy: { createdAt: 'desc' }
                });

                return products.map(p => ({
                    id: p.id,
                    slug: p.id,
                    status: 'PUBLISHED',
                    data: {
                        ...(p.variants as object || {}),
                        name: p.name,
                        description: p.description,
                        price: Number(p.price),
                        image: p.image,
                        sku: p.sku
                    },
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                }));
            }
        }

        // Find type
        const type = await prisma.cmsContentType.findUnique({
            where: { userId_slug: { userId: user.id, slug: typeSlug } }
        });
        if (!type) throw new Error("Content Type not found");

        if (entrySlug) {
            // Single entry
            const entry = await prisma.cmsContentEntry.findUnique({
                where: { contentTypeId_slug: { contentTypeId: type.id, slug: entrySlug } }
            });
            if (!entry || entry.status !== 'PUBLISHED') throw new Error("Entry not found or not published");
            return entry;
        } else {
            // List entries
            return prisma.cmsContentEntry.findMany({
                where: { contentTypeId: type.id, status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' }
            });
        }
    }
}
