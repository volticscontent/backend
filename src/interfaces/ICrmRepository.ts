import { CrmContact, CrmDeal, CrmPipeline, Prisma } from '@prisma/client';

export interface ICrmRepository {
  // Contacts
  createContact(data: Prisma.CrmContactCreateInput): Promise<CrmContact>;
  updateContact(id: string, data: Prisma.CrmContactUpdateInput): Promise<CrmContact>;
  findContactById(id: string): Promise<CrmContact | null>;
  findContactsByUserId(userId: string, filters?: any): Promise<CrmContact[]>;
  countContacts(userId: string): Promise<number>;

  // Pipelines
  createPipeline(data: Prisma.CrmPipelineCreateInput): Promise<CrmPipeline>;
  findPipelinesByUserId(userId: string): Promise<CrmPipeline[]>;
  findDefaultPipeline(userId: string): Promise<CrmPipeline | null>;

  // Deals
  createDeal(data: Prisma.CrmDealCreateInput): Promise<CrmDeal>;
  updateDeal(id: string, data: Prisma.CrmDealUpdateInput): Promise<CrmDeal>;
  findDealsByUserId(userId: string, filters?: any): Promise<CrmDeal[]>;
  countDeals(userId: string, status?: string): Promise<number>;
  sumDealValue(userId: string, status?: string): Promise<number>;
}
