import { Request, Response } from 'express';
import { MasterService } from '../services/MasterService';

export class MasterController {
  constructor(private masterService: MasterService) {}

  getDashboard = async (req: Request, res: Response) => {
      try {
          const data = await this.masterService.getDashboardData();
          res.json(data);
      } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  getUsers = async (req: Request, res: Response) => {
      try {
          const data = await this.masterService.getUsersList();
          res.json(data);
      } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  getUserDetails = async (req: Request, res: Response) => {
      try {
          const { id } = req.params;
          if (typeof id !== 'string') {
             return res.status(400).json({ error: 'Invalid ID format' });
          }
          const data = await this.masterService.getUserDetails(id);
          if (!data) return res.status(404).json({ error: 'User not found' });
          res.json(data);
      } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  getAdmins = async (req: Request, res: Response) => {
      try {
          const data = await this.masterService.getAllAdmins();
          res.json(data);
      } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }

  createService = async (req: Request, res: Response) => {
      try {
          const { userId } = req.params;
          if (typeof userId !== 'string') {
             return res.status(400).json({ error: 'Invalid User ID format' });
          }
          const service = await this.masterService.createService(userId, req.body);
          res.status(201).json(service);
      } catch (error) {
          res.status(400).json({ error: (error as Error).message });
      }
  }

  updateService = async (req: Request, res: Response) => {
      try {
          const { id } = req.params;
          if (typeof id !== 'string') {
             return res.status(400).json({ error: 'Invalid ID format' });
          }
          const service = await this.masterService.updateService(id, req.body);
          res.json(service);
      } catch (error) {
          res.status(400).json({ error: (error as Error).message });
      }
  }

  createAdmin = async (req: Request, res: Response) => {
    try {
      const admin = await this.masterService.createAdmin(req.body);
      res.status(201).json(admin);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  createClient = async (req: Request, res: Response) => {
    try {
      const client = await this.masterService.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}
