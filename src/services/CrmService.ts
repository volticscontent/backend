import { CrmRepository } from '../repositories/CrmRepository';
import { Prisma } from '@prisma/client';

export class CrmService {
  private crmRepository: CrmRepository;

  constructor() {
    this.crmRepository = new CrmRepository();
  }

  // --- Contacts ---
  async getContacts(userId: string) {
    return this.crmRepository.findContactsByUserId(userId);
  }

  async getContactStats(userId: string) {
    const total = await this.crmRepository.countContacts(userId);
    // Podemos adicionar mais stats aqui (ex: novos hoje, por origem)
    return { total };
  }

  async createContact(userId: string, data: any) {
    return this.crmRepository.createContact({
      user: { connect: { id: userId } },
      name: data.name,
      email: data.email,
      phone: data.phone,
      jobTitle: data.jobTitle,
      company: data.company,
      type: data.type || 'LEAD',
      source: data.source || 'MANUAL',
      tags: data.tags || [],
      customFields: data.customFields || {}
    });
  }

  // --- Pipelines & Deals ---
  async ensureDefaultPipeline(userId: string) {
    let pipeline = await this.crmRepository.findDefaultPipeline(userId);
    
    if (!pipeline) {
      // Create a default sales pipeline
      pipeline = await this.crmRepository.createPipeline({
        user: { connect: { id: userId } },
        name: 'Funil de Vendas Padrão',
        isDefault: true,
        stages: {
          create: [
            { name: 'Lead', color: '#3b82f6', order: 0 },
            { name: 'Contatado', color: '#eab308', order: 1 },
            { name: 'Proposta', color: '#a855f7', order: 2 },
            { name: 'Negociação', color: '#f97316', order: 3 },
            { name: 'Ganho', color: '#22c55e', order: 4 },
            { name: 'Perdido', color: '#ef4444', order: 5 }
          ]
        }
      });
    }
    return pipeline;
  }

  async getDeals(userId: string) {
    return this.crmRepository.findDealsByUserId(userId);
  }

  async getDealStats(userId: string) {
    const total = await this.crmRepository.countDeals(userId);
    const won = await this.crmRepository.countDeals(userId, 'WON');
    const open = await this.crmRepository.countDeals(userId, 'OPEN');
    const totalValue = await this.crmRepository.sumDealValue(userId);
    const wonValue = await this.crmRepository.sumDealValue(userId, 'WON');
    const pipelineValue = await this.crmRepository.sumDealValue(userId, 'OPEN');

    return {
      total,
      won,
      open,
      totalValue,
      wonValue,
      pipelineValue
    };
  }
}
