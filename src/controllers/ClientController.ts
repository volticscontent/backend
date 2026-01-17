import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/ClientService';

export class ClientController {
  constructor(private clientService: ClientService) {}

  // Usar arrow functions para preservar o 'this' ou fazer bind no router
  getDashboard = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required and must be a string' });
            return;
        }

        const data = await this.clientService.getDashboardData(clientSlug);
        res.json(data);
    } catch (error: any) {
        this.handleError(res, error);
    }
  }

  getServices = async (req: Request, res: Response): Promise<void> => {
      const { clientSlug } = req.params;
      try {
          if (!clientSlug || typeof clientSlug !== 'string') {
              res.status(400).json({ error: 'Client slug required and must be a string' });
              return;
          }
          const data = await this.clientService.getServices(clientSlug);
          res.json(data);
      } catch (error: any) {
          this.handleError(res, error);
      }
  }

  validateClientMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { clientSlug } = req.params;
      if (!clientSlug || typeof clientSlug !== 'string') {
        res.status(400).json({ error: 'Client slug not provided or invalid' });
        return;
      }

      try {
        await this.clientService.getClientBySlug(clientSlug);
        next();
      } catch (error: any) {
         if (error.message === 'Client not found') {
            res.status(404).json({ error: error.message });
         } else {
            console.error(error);
            res.status(500).json({ error: 'Internal server error checking client' });
         }
      }
  }

  private handleError(res: Response, error: any) {
      if (error.message === 'Client not found') {
          res.status(404).json({ error: error.message });
      } else {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  }
}
