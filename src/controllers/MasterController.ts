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
