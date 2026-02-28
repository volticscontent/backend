import { Request, Response } from 'express';
import { FormService } from '../services/FormService';
import { z } from 'zod';

const formService = new FormService();

export class FormController {
  async create(req: Request, res: Response) {
    try {
      const schema = z.object({
        title: z.string(),
        description: z.string().optional(),
        redirectUrl: z.string().optional(),
        schema: z.any(),
        createDataSource: z.boolean().optional()
      });

      const data = schema.parse(req.body);
      const userId = (req as any).userId; 

      const form = await formService.create(userId, data);
      return res.status(201).json(form);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Failed to create form' });
    }
  }

  async index(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const forms = await formService.list(userId);
      return res.json(forms);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch forms' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      const form = await formService.get(id as string, userId);
      if (!form) return res.status(404).json({ error: 'Form not found' });
      
      return res.json(form);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch form' });
    }
  }

  async showPublic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const form = await formService.getPublic(id as string);
      if (!form) return res.status(404).json({ error: 'Form not found' });
      
      return res.json(form);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch form' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      
      const schema = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        redirectUrl: z.string().optional(),
        schema: z.any().optional(),
        status: z.string().optional(),
        createDataSource: z.boolean().optional()
      });

      const data = schema.parse(req.body);

      const form = await formService.update(id as string, userId, data);
      return res.json(form);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Failed to update form' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      await formService.delete(id as string, userId);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: 'Failed to delete form' });
    }
  }

  async submissions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const submissions = await formService.getSubmissions(id as string, userId, page, limit);
      return res.json(submissions);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  // Public submission endpoint
  async submit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      const metadata = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
      };

      await formService.submit(id as string, data, metadata);
      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(400).json({ error: 'Failed to submit form' });
    }
  }
}
