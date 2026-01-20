import { Request, Response } from 'express';
import { CmsService } from '../services/CmsService';

const cmsService = new CmsService();

export class CmsController {
  // Types
  async createType(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const type = await cmsService.createContentType(userId, req.body);
      return res.json(type);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listTypes(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const types = await cmsService.listContentTypes(userId);
      return res.json(types);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getType(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const type = await cmsService.getContentType(userId, id as string);
      if (!type) return res.status(404).json({ error: "Not found" });
      return res.json(type);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateType(req: Request, res: Response) {
      try {
          const userId = (req as any).userId;
          const { id } = req.params;
          const type = await cmsService.updateContentType(userId, id as string, req.body);
          return res.json(type);
      } catch (error: any) {
          return res.status(400).json({ error: error.message });
      }
  }

  async deleteType(req: Request, res: Response) {
      try {
          const userId = (req as any).userId;
          const { id } = req.params;
          await cmsService.deleteContentType(userId, id as string);
          return res.json({ success: true });
      } catch (error: any) {
          return res.status(400).json({ error: error.message });
      }
  }

  // Entries
  async createEntry(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { typeId } = req.params;
      const { data, status, slug } = req.body;
      const entry = await cmsService.createContentEntry(userId, typeId as string, data, status, slug);
      return res.json(entry);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async createEntryBySlug(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { typeSlug } = req.params;
      const { data, status, slug } = req.body;
      const entry = await cmsService.createContentEntryBySlug(userId, typeSlug as string, data, status, slug);
      return res.json(entry);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listEntries(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { typeId } = req.params;
      const entries = await cmsService.listContentEntries(userId, typeId as string);
      return res.json(entries);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateEntry(req: Request, res: Response) {
      try {
          const userId = (req as any).userId;
          const { entryId } = req.params;
          const { data, status, slug } = req.body;
          const entry = await cmsService.updateContentEntry(userId, entryId as string, data, status, slug);
          return res.json(entry);
      } catch (error: any) {
          return res.status(400).json({ error: error.message });
      }
  }

  async deleteEntry(req: Request, res: Response) {
      try {
          const userId = (req as any).userId;
          const { entryId } = req.params;
          await cmsService.deleteContentEntry(userId, entryId as string);
          return res.json({ success: true });
      } catch (error: any) {
          return res.status(400).json({ error: error.message });
      }
  }

  // SDK / Public
  async getPublicContent(req: Request, res: Response) {
      try {
          const { clientSlug, typeSlug, entrySlug } = req.params;
          const content = await cmsService.getPublicContent(clientSlug as string, typeSlug as string, entrySlug as string);
          return res.json(content);
      } catch (error: any) {
          return res.status(404).json({ error: error.message });
      }
  }
}
