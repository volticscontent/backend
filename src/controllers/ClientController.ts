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
      console.log(`[ClientController] getServices called for slug: ${clientSlug}`);
      try {
          if (!clientSlug || typeof clientSlug !== 'string') {
              console.log('[ClientController] Invalid slug');
              res.status(400).json({ error: 'Client slug required and must be a string' });
              return;
          }
          const data = await this.clientService.getServices(clientSlug);
          console.log(`[ClientController] Services data retrieved:`, JSON.stringify(data));
          
          if (!data) {
             console.log('[ClientController] Data is null/undefined, returning empty array');
             res.json([]);
             return;
          }

          res.json(data);
      } catch (error: any) {
          console.error('[ClientController] Error in getServices:', error);
        this.handleError(res, error);
    }
}

getServicesDashboard = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    console.log(`[ClientController] getServicesDashboard called for slug: ${clientSlug}`);
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required' });
            return;
        }
        const data = await this.clientService.getServicesDashboard(clientSlug);
        res.json(data);
    } catch (error: any) {
        console.error('[ClientController] Error in getServicesDashboard:', error);
        this.handleError(res, error);
    }
}

getTickets = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required' });
            return;
        }
        const data = await this.clientService.getTickets(clientSlug);
        res.json(data);
    } catch (error: any) {
        console.error('[ClientController] Error in getTickets:', error);
        this.handleError(res, error);
    }
}

createTicket = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    const { subject, message, priority } = req.body;
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required' });
            return;
        }
        const data = await this.clientService.createTicket(clientSlug, { subject, message, priority });
        res.status(201).json(data);
    } catch (error: any) {
        console.error('[ClientController] Error in createTicket:', error);
        this.handleError(res, error);
    }
}

getInvoices = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required' });
            return;
        }
        const data = await this.clientService.getInvoices(clientSlug);
        res.json(data);
    } catch (error: any) {
        console.error('[ClientController] Error in getInvoices:', error);
        this.handleError(res, error);
    }
}

  getTeam = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required and must be a string' });
            return;
        }
        const data = await this.clientService.getTeam(clientSlug);
        res.json(data);
    } catch (error: any) {
        this.handleError(res, error);
    }
  }

  getSidebarMenu = async (req: Request, res: Response): Promise<void> => {
    const { clientSlug } = req.params;
    try {
        if (!clientSlug || typeof clientSlug !== 'string') {
            res.status(400).json({ error: 'Client slug required' });
            return;
        }
        const menu = await this.clientService.getSidebarMenu(clientSlug);
        res.json(menu);
    } catch (error: any) {
        this.handleError(res, error);
    }
  }

  validateClientMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { clientSlug } = req.params;
    console.log(`[validateClientMiddleware] Validating slug: "${clientSlug}" for path: ${req.path}`);
    
    if (!clientSlug || typeof clientSlug !== 'string') {
      res.status(400).json({ error: 'Client slug not provided or invalid' });
      return;
    }

      try {
        const client = await this.clientService.getClientBySlug(clientSlug);
        console.log(`[validateClientMiddleware] Client found: ${client.id} (slug: ${client.slug})`);
        next();
      } catch (error: any) {
         console.log(`[validateClientMiddleware] Error validating client with slug "${clientSlug}": ${error.message}`);
         if (error.message === 'Client not found') {
            res.status(404).json({ error: `Client not found for slug: ${clientSlug}` });
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
