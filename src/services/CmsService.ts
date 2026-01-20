import prisma from "../lib/prisma";

export class CmsService {
  // Content Types
  async createContentType(userId: string, data: any) {
    // Generate slug from name if not provided
    const slug = data.slug || data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    return prisma.cmsContentType.create({
      data: {
        userId,
        name: data.name,
        slug,
        fields: data.fields || [],
        description: data.description
      }
    });
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
    return prisma.cmsContentType.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        fields: data.fields,
        description: data.description
      }
    });
  }

  async deleteContentType(userId: string, id: string) {
    return prisma.cmsContentType.delete({
      where: { id }
    });
  }

  // Content Entries
  async createContentEntry(userId: string, typeId: string, data: any, status: string = "DRAFT", slug?: string) {
      // Verify type belongs to user
      const type = await prisma.cmsContentType.findUnique({ where: { id: typeId } });
      if (!type || type.userId !== userId) throw new Error("Invalid content type");

      if (slug) {
          const existing = await prisma.cmsContentEntry.findUnique({
            where: { contentTypeId_slug: { contentTypeId: typeId, slug } }
          });
          if (existing) throw new Error("Slug already used");
      }

      return prisma.cmsContentEntry.create({
          data: {
              contentTypeId: typeId,
              data,
              status,
              slug
          }
      });
  }

  async createContentEntryBySlug(userId: string, typeSlug: string, data: any, status: string = "DRAFT", slug?: string) {
      const type = await prisma.cmsContentType.findUnique({
        where: {
          userId_slug: {
            userId,
            slug: typeSlug,
          },
        },
      });

      if (!type) throw new Error("Content Type not found");

      if (slug) {
          const existing = await prisma.cmsContentEntry.findUnique({
              where: {
                  contentTypeId_slug: {
                      contentTypeId: type.id,
                      slug
                  }
              }
          });
          if (existing) throw new Error("Slug already used in this content type");
      }

      return prisma.cmsContentEntry.create({
        data: {
          contentTypeId: type.id,
          data,
          status,
          slug,
        },
      });
  }

  async listContentEntries(userId: string, typeId: string) {
      // Verify ownership via type check or trust the controller's flow.
      // Ideally check type.userId === userId.
      const type = await prisma.cmsContentType.findUnique({ where: { id: typeId } });
      if (!type || type.userId !== userId) throw new Error("Invalid content type");

      return prisma.cmsContentEntry.findMany({
          where: { contentTypeId: typeId },
          orderBy: { createdAt: 'desc' }
      });
  }

  async updateContentEntry(userId: string, entryId: string, data: any, status: string, slug?: string) {
      // Check ownership
      const entry = await prisma.cmsContentEntry.findUnique({
          where: { id: entryId },
          include: { contentType: true }
      });
      if (!entry || entry.contentType.userId !== userId) throw new Error("Entry not found");

      return prisma.cmsContentEntry.update({
          where: { id: entryId },
          data: {
              data,
              status,
              slug
          }
      });
  }

  async deleteContentEntry(userId: string, entryId: string) {
      const entry = await prisma.cmsContentEntry.findUnique({
          where: { id: entryId },
          include: { contentType: true }
      });
      if (!entry || entry.contentType.userId !== userId) throw new Error("Entry not found");

      return prisma.cmsContentEntry.delete({
          where: { id: entryId }
      });
  }

  // Public/SDK
  async getPublicContent(clientSlug: string, typeSlug: string, entrySlug?: string) {
      // Find user by slug
      const user = await prisma.user.findUnique({ where: { slug: clientSlug } });
      if (!user) throw new Error("Client not found");

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
