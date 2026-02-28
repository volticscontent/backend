import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  private service: ProductService;

  constructor() {
    this.service = new ProductService();
  }

  list = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const products = await this.service.listUnified(userId);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  create = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const product = await this.service.create(userId, req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const product = await this.service.update(req.params.id as string, userId, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  delete = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      await this.service.delete(req.params.id as string, userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  get = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const product = await this.service.get(req.params.id as string, userId);
      if (!product) return res.status(404).json({ error: 'Not found' });
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
