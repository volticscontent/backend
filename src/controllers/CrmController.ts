import { Request, Response } from 'express';
import { CrmService } from '../services/CrmService';

export class CrmController {
  private crmService: CrmService;

  constructor() {
    this.crmService = new CrmService();
  }

  getContacts = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const contacts = await this.crmService.getContacts(userId);
      return res.json(contacts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  createContact = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const contact = await this.crmService.createContact(userId, req.body);
      return res.status(201).json(contact);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  getDeals = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const deals = await this.crmService.getDeals(userId);
      return res.json(deals);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  getStats = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      
      const [contactStats, dealStats] = await Promise.all([
        this.crmService.getContactStats(userId),
        this.crmService.getDealStats(userId)
      ]);

      return res.json({
        contacts: contactStats,
        deals: dealStats
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
