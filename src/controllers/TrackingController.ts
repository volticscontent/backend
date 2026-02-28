import { Request, Response } from "express";
import { TrackingService } from "../services/TrackingService";

const trackingService = new TrackingService();

export class TrackingController {
  
  // Datasets
  async getDatasets(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    try {
      const datasets = await trackingService.getDatasets(userId);
      return res.json(datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      return res.status(500).json({ error: "Failed to fetch datasets" });
    }
  }

  async getDataset(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    try {
      const dataset = await trackingService.getDatasetById(userId, id as string);
      if (!dataset) return res.status(404).json({ error: "Dataset not found" });
      return res.json(dataset);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch dataset" });
    }
  }

  async getDatasetEvents(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { datasetId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    try {
      const result = await trackingService.getEvents(userId, datasetId as string, page, limit);
      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch events" });
    }
  }

  async getDatasetStats(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { datasetId } = req.params;

    try {
      const stats = await trackingService.getDatasetStats(userId, datasetId as string);
      return res.json(stats);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }

  async createDataset(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { name, description } = req.body;
    try {
      const dataset = await trackingService.createDataset(userId, name, description);
      return res.status(201).json(dataset);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create dataset" });
    }
  }

  async updateDataset(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, description } = req.body;
    try {
      const dataset = await trackingService.updateDataset(userId, id as string, { name, description });
      return res.json(dataset);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update dataset" });
    }
  }

  async deleteDataset(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    try {
      await trackingService.deleteDataset(userId, id as string);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete dataset" });
    }
  }

  // Destinations
  async addDestination(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { datasetId } = req.params;
    const { platform, config } = req.body;
    try {
      const destination = await trackingService.addDestination(userId, datasetId as string, platform, config);
      return res.status(201).json(destination);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to add destination" });
    }
  }

  async updateDestination(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    const { enabled, config } = req.body;
    try {
      const destination = await trackingService.updateDestination(userId, id as string, { enabled, config });
      return res.json(destination);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update destination" });
    }
  }

  async deleteDestination(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    try {
      await trackingService.deleteDestination(userId, id as string);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete destination" });
    }
  }

  // Sources
  async addSource(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { datasetId } = req.params;
    const { type, name, provider, config } = req.body;
    try {
      const source = await trackingService.addSource(userId, datasetId as string, type, name, provider, config);
      return res.status(201).json(source);
    } catch (error) {
      return res.status(500).json({ error: "Failed to add source" });
    }
  }

  async updateSource(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    const { enabled, config, name } = req.body;
    try {
      const source = await trackingService.updateSource(userId, id as string, { enabled, config, name });
      return res.json(source);
    } catch (error) {
      return res.status(500).json({ error: "Failed to update source" });
    }
  }

  async deleteSource(req: Request, res: Response) {
    // @ts-ignore
    const userId = (req as any).userId;
    const { id } = req.params;
    try {
      await trackingService.deleteSource(userId, id as string);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Failed to delete source" });
    }
  }

  async trackEvent(req: Request, res: Response) {
    const { datasetId } = req.params;
    const event = req.body;

    // We can add basic validation here
    // Note: eventId might be generated by the service if not provided
    if (!event.eventName) {
        return res.status(400).json({ error: "Invalid event structure" });
    }

    // Capture IP and User Agent if not present in body
    // x-forwarded-for is important when behind proxies/load balancers
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const enrichedEvent = {
        ...event,
        clientIp: event.clientIp || clientIp,
        userAgent: event.userAgent || userAgent
    };

    // Fire and forget - processing happens in background
    // In production, this would go to a Queue (RabbitMQ/Redis)
    trackingService.processEvent(datasetId as string, enrichedEvent).catch(err => {
        console.error("Error processing event:", err);
    });

    return res.status(200).json({ status: "received" });
  }
}
