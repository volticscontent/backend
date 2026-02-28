import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { DataSourceService } from '../services/DataSourceService';

export class CheckoutSettingsController {
  private dataSourceService = new DataSourceService();

  async getSettings(req: Request, res: Response) {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    try {
      // 1. Get Service to find userId
      const service = await prisma.service.findUnique({
        where: { id: String(serviceId) },
        select: { userId: true, title: true }
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // 2. Ensure Fonte de Dados (DataSource) exists for this checkout
      let dataSource = await prisma.dataSource.findFirst({
        where: {
          userId: service.userId,
          type: 'CHECKOUT',
          integrationId: String(serviceId)
        }
      });

      if (!dataSource) {
        dataSource = await this.dataSourceService.createDataSource(service.userId, {
          name: `Checkout: ${service.title}`,
          type: 'CHECKOUT',
          integrationId: String(serviceId),
          status: 'ACTIVE'
        });
      }

      // 3. Get Settings
      const settings = await prisma.checkoutSettings.findUnique({
        where: { serviceId: String(serviceId) },
        include: { dataSource: true }
      });

      if (!settings) {
        // Return default settings if not found
        return res.json({
          pixels: {
            facebook: '',
            google: '',
            tiktok: '',
          },
          config: {
            collectPhone: true,
            collectAddress: true,
            onePageCheckout: false,
          },
          dataSource: {
            id: dataSource.id,
            name: dataSource.name
          }
        });
      }

      // Map to the format expected by frontend
      return res.json({
        pixels: {
          facebook: settings.facebookPixelId || '',
          google: settings.googlePixelId || '',
          tiktok: settings.tiktokPixelId || '',
        },
        config: {
          collectPhone: settings.collectPhone,
          collectAddress: settings.collectAddress,
          onePageCheckout: settings.onePageCheckout,
        },
        dataSource: {
          id: settings.dataSourceId || dataSource.id,
          name: settings.dataSource?.name || dataSource.name
        }
      });
    } catch (error: any) {
      console.error('Error fetching checkout settings:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req: Request, res: Response) {
    const { serviceId } = req.params;
    const { pixels, config, dataSourceId } = req.body;

    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    try {
      // Upsert settings
      const settings = await prisma.checkoutSettings.upsert({
        where: { serviceId: String(serviceId) },
        create: {
          serviceId: String(serviceId),
          facebookPixelId: pixels?.facebook,
          googlePixelId: pixels?.google,
          tiktokPixelId: pixels?.tiktok,
          collectPhone: config?.collectPhone ?? true,
          collectAddress: config?.collectAddress ?? true,
          onePageCheckout: config?.onePageCheckout ?? false,
          dataSourceId: dataSourceId,
        },
        update: {
          facebookPixelId: pixels?.facebook,
          googlePixelId: pixels?.google,
          tiktokPixelId: pixels?.tiktok,
          collectPhone: config?.collectPhone,
          collectAddress: config?.collectAddress,
          onePageCheckout: config?.onePageCheckout,
          dataSourceId: dataSourceId,
        },
        include: { dataSource: true }
      });

      return res.json({
        pixels: {
          facebook: settings.facebookPixelId || '',
          google: settings.googlePixelId || '',
          tiktok: settings.tiktokPixelId || '',
        },
        config: {
          collectPhone: settings.collectPhone,
          collectAddress: settings.collectAddress,
          onePageCheckout: settings.onePageCheckout,
        },
        dataSource: {
          id: settings.dataSourceId,
          name: settings.dataSource?.name
        }
      });
    } catch (error: any) {
      console.error('Error updating checkout settings:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}
