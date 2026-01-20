import { Request, Response } from 'express';
import { CredentialService } from '../services/CredentialService';

export class CredentialController {
  private credentialService: CredentialService;

  constructor() {
    this.credentialService = new CredentialService();
  }

  createCredential = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const credential = await this.credentialService.createCredential(userId, name);
      return res.status(201).json(credential);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  listCredentials = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const credentials = await this.credentialService.listCredentials(userId);
      return res.json(credentials);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };

  deleteCredential = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      await this.credentialService.deleteCredential(userId, id as string);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  };
}
