import prisma from '../lib/prisma';
import { DataSource } from '@prisma/client';

export class DataSourceService {
  
  async createDataSource(userId: string, data: {
    name: string;
    type: string;
    integrationId?: string;
    config?: any;
    status?: string;
  }) {
    // Check if exists to avoid duplicates based on integrationId if provided
    if (data.integrationId) {
      const existing = await prisma.dataSource.findFirst({
        where: {
          userId,
          type: data.type,
          integrationId: data.integrationId
        }
      });
      if (existing) {
        return prisma.dataSource.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            config: data.config ? { ...(existing.config as object), ...data.config } : existing.config,
            status: data.status || existing.status,
            updatedAt: new Date()
          }
        });
      }
    }

    return prisma.dataSource.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        integrationId: data.integrationId,
        config: data.config,
        status: data.status || 'ACTIVE'
      }
    });
  }

  async getDataSources(userId: string) {
    return prisma.dataSource.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateDataSource(id: string, data: Partial<DataSource>) {
    // Exclude userId and id from update to avoid type errors and accidental changes
    const { userId, id: _, createdAt, updatedAt, ...updateData } = data;
    
    return prisma.dataSource.update({
      where: { id },
      data: updateData as any
    });
  }

  async deleteDataSource(id: string) {
    return prisma.dataSource.delete({
      where: { id }
    });
  }

  async syncDataSource(id: string) {
    // Logic to trigger a sync based on type
    const dataSource = await prisma.dataSource.findUnique({ where: { id } });
    if (!dataSource) throw new Error('Data source not found');

    // Here we would call specific services based on type
    // e.g. if (dataSource.type === 'STRIPE') stripeService.syncTransactions(...)

    return prisma.dataSource.update({
      where: { id },
      data: { lastSyncedAt: new Date() }
    });
  }

  async getDataSourceData(id: string, page = 1, limit = 50, filters: any = {}) {
    const dataSource = await prisma.dataSource.findUnique({ where: { id } });
    if (!dataSource) throw new Error('Data source not found');

    if (dataSource.type === 'FORM' && dataSource.integrationId) {
      const submissions = await prisma.formSubmission.findMany({
        where: { formId: dataSource.integrationId },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' }
      });
      
      const form = await prisma.form.findUnique({
         where: { id: dataSource.integrationId },
         select: { schema: true }
      });

      const schema = form?.schema as any;
      const fields = schema?.fields || [];
      
      const fieldsMap = new Map();
      fields.forEach((f: any) => {
           fieldsMap.set(f.id, f.mappingKey || f.id);
      });

      return {
        columns: fields.map((f: any) => ({
            key: f.id,
            label: f.label,
            mappingKey: f.mappingKey || f.id
        })),
        data: submissions.map(s => {
            const rawData = s.data as any || {};
            const mappedData: any = {
                id: s.id,
                createdAt: s.createdAt
            };
            
            // Map data keys to mappingKeys if available
            Object.keys(rawData).forEach(fieldId => {
                const key = fieldsMap.get(fieldId) || fieldId;
                mappedData[key] = rawData[fieldId];
            });
            
            return mappedData;
        }),
        total: await prisma.formSubmission.count({ where: { formId: dataSource.integrationId } })
      };
    }

    if (dataSource.type === 'TRACKING' || dataSource.type === 'STRIPE') {
        const config = dataSource.config as any;
        const datasetId = config?.datasetId;

        if (!datasetId) {
             return { columns: [], data: [], total: 0 };
        }

        const events = await prisma.trackingEvent.findMany({
            where: { datasetId: datasetId },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' }
        });

        // Dynamic columns based on the event data keys of the first few records
        // This is a bit loose, but works for generic visualization
        const sampleKeys = new Set<string>();
        events.slice(0, 5).forEach(e => {
            if (e.eventData && typeof e.eventData === 'object') {
                Object.keys(e.eventData).forEach(k => sampleKeys.add(k));
            }
        });

        const columns = [
            { key: 'eventName', label: 'Event Name' },
            { key: 'status', label: 'Status' },
            ...Array.from(sampleKeys).map(k => ({ key: k, label: k, mappingKey: k }))
        ];

        return {
            columns,
            data: events.map(e => ({
                id: e.id,
                createdAt: e.createdAt,
                eventName: e.eventName,
                status: e.status,
                ...(e.eventData as object)
            })),
            total: await prisma.trackingEvent.count({ where: { datasetId: datasetId } })
        };
    }

    if (dataSource.type === 'CMS' && dataSource.integrationId) {
        const contentType = await prisma.cmsContentType.findUnique({ 
            where: { id: dataSource.integrationId } 
        });

        if (!contentType) return { columns: [], data: [], total: 0 };

        const where: any = { contentTypeId: contentType.id };
        
        if (filters.source && filters.source !== 'ALL') {
            // Prisma JSON filtering syntax
            where.data = {
                path: ['source'],
                equals: filters.source
            };
        }

        const entries = await prisma.cmsContentEntry.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' }
        });

        const columns = (contentType.fields as any[]).map((f: any) => ({
            key: f.key,
            label: f.label,
            mappingKey: f.key
        }));

        // Add standard columns
        columns.unshift({ key: 'status', label: 'Status', mappingKey: 'status' });
        // Add source column if data has it, or generic "Origem"
        columns.push({ key: 'source', label: 'Origem', mappingKey: 'source' });

        return {
            columns,
            data: entries.map(e => {
                const data = e.data as any || {};
                return {
                    id: e.id,
                    createdAt: e.createdAt,
                    status: e.status,
                    source: data.source || 'Manual', // Default to Manual if no source
                    ...data
                };
            }),
            total: await prisma.cmsContentEntry.count({ where })
        };
    }

    if (dataSource.type === 'PRODUCT') {
        const products = await prisma.product.findMany({
            where: { userId: dataSource.userId },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' }
        });

        return {
            columns: [
                { key: 'name', label: 'Name', mappingKey: 'name' },
                { key: 'price', label: 'Price', mappingKey: 'price' },
                { key: 'sku', label: 'SKU', mappingKey: 'sku' },
                { key: 'active', label: 'Active', mappingKey: 'active' }
            ],
            data: products.map(p => ({
                id: p.id,
                createdAt: p.createdAt,
                name: p.name,
                price: p.price,
                sku: p.sku,
                active: p.active
            })),
            total: await prisma.product.count({ where: { userId: dataSource.userId } })
        };
    }



    if (dataSource.type === 'CAMPAIGN' && dataSource.integrationId) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: dataSource.integrationId }
        });

        if (!campaign) return { columns: [], data: [], total: 0 };

        // For now, we return the campaign itself as the data. 
        // In the future, we can aggregate tracking events where utm_campaign == campaign.name
        
        const columns = [
            { key: 'name', label: 'Name', mappingKey: 'name' },
            { key: 'status', label: 'Status', mappingKey: 'status' },
            { key: 'createdAt', label: 'Created At', mappingKey: 'createdAt' }
        ];

        return {
            columns,
            data: [{
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                createdAt: campaign.createdAt
            }],
            total: 1
        };
    }
    
    // Default empty for other types for now
    return { columns: [], data: [], total: 0 };
  }
}
