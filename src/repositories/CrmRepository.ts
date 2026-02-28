import { ICrmRepository } from '../interfaces/ICrmRepository';
import prisma from '../lib/prisma';
import { CrmContact, CrmDeal, CrmPipeline, Prisma } from '@prisma/client';

export class CrmRepository implements ICrmRepository {
  // Contacts
  async createContact(data: Prisma.CrmContactCreateInput): Promise<CrmContact> {
    return prisma.crmContact.create({ data });
  }

  async updateContact(id: string, data: Prisma.CrmContactUpdateInput): Promise<CrmContact> {
    return prisma.crmContact.update({ where: { id }, data });
  }

  async findContactById(id: string): Promise<CrmContact | null> {
    return prisma.crmContact.findUnique({ where: { id }, include: { deals: true } });
  }

  async findContactsByUserId(userId: string, filters?: any): Promise<CrmContact[]> {
    return prisma.crmContact.findMany({
      where: { userId, ...filters },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countContacts(userId: string): Promise<number> {
    return prisma.crmContact.count({ where: { userId } });
  }

  // Pipelines
  async createPipeline(data: Prisma.CrmPipelineCreateInput): Promise<CrmPipeline> {
    return prisma.crmPipeline.create({ data });
  }

  async findPipelinesByUserId(userId: string): Promise<CrmPipeline[]> {
    return prisma.crmPipeline.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' } // Create order usually matters for pipelines
    });
  }

  async findDefaultPipeline(userId: string): Promise<CrmPipeline | null> {
    return prisma.crmPipeline.findFirst({
      where: { userId, isDefault: true }
    });
  }

  // Deals
  async createDeal(data: Prisma.CrmDealCreateInput): Promise<CrmDeal> {
    return prisma.crmDeal.create({ data });
  }

  async updateDeal(id: string, data: Prisma.CrmDealUpdateInput): Promise<CrmDeal> {
    return prisma.crmDeal.update({ where: { id }, data });
  }

  async findDealsByUserId(userId: string, filters?: any): Promise<CrmDeal[]> {
    return prisma.crmDeal.findMany({
      where: { userId, ...filters },
      include: { contact: true, pipeline: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countDeals(userId: string, status?: string): Promise<number> {
    const where: any = { userId };
    if (status) where.status = status;
    return prisma.crmDeal.count({ where });
  }

  async sumDealValue(userId: string, status?: string): Promise<number> {
    const where: any = { userId };
    if (status) where.status = status;
    
    const aggregate = await prisma.crmDeal.aggregate({
      where,
      _sum: { value: true }
    });

    return Number(aggregate._sum.value || 0);
  }
}
