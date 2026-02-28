import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import { DataSourceService } from "./DataSourceService";

export class CampaignService {
  private dataSourceService: DataSourceService;

  constructor() {
    this.dataSourceService = new DataSourceService();
  }
  
  async createCampaign(userId: string, serviceId: string, data: { name: string, description?: string, status?: string }) {
    // Verify service ownership
    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId }
    });

    if (!service) {
      throw new Error("Service not found or access denied");
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        serviceId,
        name: data.name,
        description: data.description,
        status: data.status || "ACTIVE"
      }
    });

    // Auto-create DataSource
    await this.ensureCampaignDataSource(userId, campaign.id, campaign.name);

    return campaign;
  }

  async getCampaigns(userId: string, serviceId: string) {
    return prisma.campaign.findMany({
      where: { userId, serviceId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCampaignById(userId: string, campaignId: string) {
    return prisma.campaign.findFirst({
      where: { id: campaignId, userId }
    });
  }

  async updateCampaign(userId: string, campaignId: string, data: { name?: string, description?: string, status?: string }) {
    // Verify ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId }
    });

    if (!campaign) {
      throw new Error("Campaign not found or access denied");
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data
    });

    if (data.name) {
        const dataSource = await prisma.dataSource.findFirst({
            where: { userId, type: 'CAMPAIGN', integrationId: campaignId }
        });
        if (dataSource) {
            await prisma.dataSource.update({
                where: { id: dataSource.id },
                data: { name: `Campaign: ${data.name}` }
            });
        }
    }

    // Ensure it exists (in case it was missing)
    await this.ensureCampaignDataSource(userId, campaignId, updated.name);

    return updated;
  }

  async deleteCampaign(userId: string, campaignId: string) {
    // Verify ownership
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId }
    });

    if (!campaign) {
      throw new Error("Campaign not found or access denied");
    }

    const deleted = await prisma.campaign.delete({
      where: { id: campaignId }
    });

    await prisma.dataSource.deleteMany({
        where: { userId, type: 'CAMPAIGN', integrationId: campaignId }
    });

    return deleted;
  }

  private async ensureCampaignDataSource(userId: string, campaignId: string, name: string) {
    const existing = await prisma.dataSource.findFirst({
        where: {
            userId,
            type: 'CAMPAIGN',
            integrationId: campaignId
        }
    });

    if (!existing) {
        await this.dataSourceService.createDataSource(userId, {
            name: `Campaign: ${name}`,
            type: 'CAMPAIGN',
            integrationId: campaignId,
            status: 'ACTIVE'
        });
    }
  }
}
