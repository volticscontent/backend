import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  constructor(private authService: AuthService) {}

  async registerClient(req: Request, res: Response) {
    try {
      const { name, email, password, slug, plan } = req.body;
      if (!name || !email || !password || !slug) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await this.authService.registerClient({ name, email, password, slug, plan });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async loginClient(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await this.authService.loginClient(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async loginAdmin(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await this.authService.loginAdmin(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }
}
