import prisma from '../lib/prisma';
import { DataSourceService } from './DataSourceService';

export class FormService {
  private dataSourceService: DataSourceService;

  constructor() {
    this.dataSourceService = new DataSourceService();
  }

  async create(userId: string, data: { title: string; description?: string; schema: any; redirectUrl?: string; createDataSource?: boolean }) {
    // 1. Create the Form
    const form = await prisma.form.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        schema: data.schema,
        redirectUrl: data.redirectUrl,
        status: 'ACTIVE'
      }
    });

    // 2. Ensure DataSource exists for this Form if requested
    if (data.createDataSource) {
      await this.ensureFormDataSource(userId, form.id, form.title);
    }

    return form;
  }

  async update(id: string, userId: string, data: { title?: string; description?: string; schema?: any; redirectUrl?: string; status?: string; createDataSource?: boolean }) {
    const form = await prisma.form.update({
      where: { id, userId },
      data: {
        title: data.title,
        description: data.description,
        schema: data.schema,
        redirectUrl: data.redirectUrl,
        status: data.status
      }
    });

    // Update DataSource name if title changed
    if (data.title) {
      const dataSource = await prisma.dataSource.findFirst({
        where: {
          userId,
          type: 'FORM',
          integrationId: form.id
        }
      });

      if (dataSource) {
        await prisma.dataSource.update({
          where: { id: dataSource.id },
          data: { name: `Form: ${data.title}` }
        });
      }
    }

    // Handle DataSource creation/deletion on update
    if (data.createDataSource === true) {
       await this.ensureFormDataSource(userId, form.id, form.title);
    } else if (data.createDataSource === false) {
       // If explicitly set to false, maybe we should remove it?
       // Or just leave it. The prompt says "connect to marketing data sources".
       // Usually disabling a sync might mean deleting the source or pausing it.
       // Let's stick to "ensure" for now. If user wants to disconnect, they can delete the DataSource.
    }

    return form;
  }

  async delete(id: string, userId: string) {
    // DataSource will be deleted via Cascade if we set it up that way, 
    // but usually DataSource is loosely coupled. We should delete it manually or archive it.
    // Let's archive the DataSource instead of deleting, or delete if it's strictly 1:1.
    // Given the prompt, let's delete it to keep clean.
    
    const form = await prisma.form.delete({
      where: { id, userId }
    });

    await prisma.dataSource.deleteMany({
      where: {
        userId,
        type: 'FORM',
        integrationId: id
      }
    });

    return form;
  }

  async list(userId: string) {
    return prisma.form.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });
  }

  async get(id: string, userId: string) {
    return prisma.form.findUnique({
      where: { id, userId },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });
  }

  // Public access (no userId check needed for fetching schema to render)
  async getPublic(id: string) {
    return prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        schema: true,
        redirectUrl: true,
        status: true
      }
    });
  }

  async submit(formId: string, data: any, metadata?: { ip?: string; userAgent?: string; referer?: string }) {
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.status !== 'ACTIVE') {
      throw new Error('Form not found or inactive');
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        data,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
        referer: metadata?.referer
      }
    });

    // Update DataSource lastSyncedAt
    const dataSource = await prisma.dataSource.findFirst({
        where: {
            type: 'FORM',
            integrationId: formId
        }
    });

    if (dataSource) {
        await prisma.dataSource.update({
            where: { id: dataSource.id },
            data: { lastSyncedAt: new Date() }
        });
    }

    return submission;
  }

  async getSubmissions(formId: string, userId: string, page = 1, limit = 50) {
    // Verify ownership
    const form = await prisma.form.findUnique({ where: { id: formId, userId } });
    if (!form) throw new Error('Form not found');

    return prisma.formSubmission.findMany({
      where: { formId },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  private async ensureFormDataSource(userId: string, formId: string, formTitle: string) {
    const existing = await prisma.dataSource.findFirst({
      where: {
        userId,
        type: 'FORM',
        integrationId: formId
      }
    });

    if (!existing) {
      await prisma.dataSource.create({
        data: {
          userId,
          name: `Form: ${formTitle}`,
          type: 'FORM',
          integrationId: formId,
          status: 'ACTIVE',
          config: { formId }
        }
      });
    }
  }
}
