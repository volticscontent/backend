import { Request, Response } from 'express';
import { DataSourceService } from '../services/DataSourceService';
import { ClientService } from '../services/ClientService';
import { UserRepository } from '../repositories/UserRepository';
import { AdminRepository } from '../repositories/AdminRepository';

export class DataSourceController {
  private dataSourceService = new DataSourceService();
  private clientService = new ClientService(new UserRepository(), new AdminRepository());

  getDataSources = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const user = await this.clientService.getClientBySlug(clientSlug as string);
      const sources = await this.dataSourceService.getDataSources(user.id);
      res.json(sources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  createDataSource = async (req: Request, res: Response) => {
    try {
      const { clientSlug } = req.params;
      const user = await this.clientService.getClientBySlug(clientSlug as string);
      const { name, type, config, integrationId, status } = req.body;
      
      const source = await this.dataSourceService.createDataSource(user.id, {
        name,
        type,
        config,
        integrationId,
        status
      });
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  updateDataSource = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const source = await this.dataSourceService.updateDataSource(id as string, data);
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  deleteDataSource = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.dataSourceService.deleteDataSource(id as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  syncDataSource = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const source = await this.dataSourceService.syncDataSource(id as string);
      res.json(source);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  getData = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};
      
      const data = await this.dataSourceService.getDataSourceData(id as string, page, limit, filters);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
