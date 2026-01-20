import prisma from "../lib/prisma";
import { DestinationPlatform, SourceType, WebhookProvider } from "@prisma/client";
import { createHash } from "crypto";

export class TrackingService {
  
  // Dataset Management
  async createDataset(userId: string, name: string, description?: string) {
    return prisma.trackingDataset.create({
      data: {
        userId,
        name,
        description
      }
    });
  }

  async getDatasets(userId: string) {
    return prisma.trackingDataset.findMany({
      where: { userId },
      include: {
        destinations: true,
        sources: true,
        _count: {
          select: { destinations: true, sources: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getDatasetById(userId: string, datasetId: string) {
    return prisma.trackingDataset.findFirst({
      where: { id: datasetId, userId },
      include: {
        destinations: true,
        sources: true
      }
    });
  }

  async updateDataset(userId: string, datasetId: string, data: { name?: string, description?: string }) {
    return prisma.trackingDataset.update({
      where: { id: datasetId, userId },
      data
    });
  }

  async deleteDataset(userId: string, datasetId: string) {
    return prisma.trackingDataset.delete({
      where: { id: datasetId, userId }
    });
  }

  async getEvents(userId: string, datasetId: string, page = 1, limit = 50) {
    // Verify ownership
    const dataset = await this.getDatasetById(userId, datasetId);
    if (!dataset) throw new Error("Dataset not found");

    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      prisma.trackingEvent.findMany({
        where: { datasetId },
        include: {
          deliveries: {
            include: {
              destination: {
                select: { platform: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip
      }),
      prisma.trackingEvent.count({ where: { datasetId } })
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getDatasetStats(userId: string, datasetId: string) {
    const dataset = await this.getDatasetById(userId, datasetId);
    if (!dataset) throw new Error("Dataset not found");

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = await prisma.trackingEvent.findMany({
        where: {
            datasetId,
            createdAt: { gte: twentyFourHoursAgo }
        },
        select: { createdAt: true }
    });
    
    // Group by hour (0-23 hours ago)
    const eventsByHour = new Array(24).fill(0);
    recentEvents.forEach(e => {
        const hourDiff = Math.floor((now.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60));
        if (hourDiff >= 0 && hourDiff < 24) {
            eventsByHour[23 - hourDiff]++; // Index 23 is current hour, 0 is 24h ago
        }
    });

    return {
        totalEvents24h: recentEvents.length,
        eventsByHour,
        lastEventTime: recentEvents.length > 0 ? recentEvents[0].createdAt : null
    };
  }

  // Destination Management
  async addDestination(
    userId: string, 
    datasetId: string, 
    platform: DestinationPlatform, 
    config: any
  ) {
    // Verify ownership
    const dataset = await this.getDatasetById(userId, datasetId);
    if (!dataset) throw new Error("Dataset not found");

    return prisma.trackingDestination.create({
      data: {
        datasetId,
        platform,
        config,
        enabled: true
      }
    });
  }

  async updateDestination(
    userId: string,
    destinationId: string,
    data: { enabled?: boolean, config?: any }
  ) {
    // We need to verify dataset ownership through the destination
    const destination = await prisma.trackingDestination.findUnique({
      where: { id: destinationId },
      include: { dataset: true }
    });

    if (!destination || destination.dataset.userId !== userId) {
      throw new Error("Destination not found or access denied");
    }

    return prisma.trackingDestination.update({
      where: { id: destinationId },
      data
    });
  }

  async deleteDestination(userId: string, destinationId: string) {
    const destination = await prisma.trackingDestination.findUnique({
      where: { id: destinationId },
      include: { dataset: true }
    });

    if (!destination || destination.dataset.userId !== userId) {
      throw new Error("Destination not found or access denied");
    }

    return prisma.trackingDestination.delete({
      where: { id: destinationId }
    });
  }

// import { createHash } from "crypto";

  // Deduplication Helper
  private generateEventId(eventName: string, eventData: any, timestamp: number): string {
    // Create a unique hash based on critical event properties
    // This allows us to recognize the same event even if it comes from different sources slightly differently
    const payload = JSON.stringify({
      eventName,
      data: eventData, // We assume critical business data (value, currency, content_ids) matches
      // We use a time window (e.g., same minute) to allow slight drift but prevent collisions
      timeWindow: Math.floor(timestamp / 60) 
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  private hashData(data: string): string {
      return createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
  }

  // Event Processing Pipeline
  async processEvent(datasetId: string, event: any) {
    const { eventName, eventData, eventId, userAgent, url, timestamp } = event;
    
    // 1. Deduplication Check
    // In a real high-scale system, we would use Redis here.
    // Key: `dedup:${datasetId}:${eventId || this.generateEventId(eventName, eventData, timestamp)}`
    // TTL: 48 hours (standard attribution window)
    
    // For now (MVP), we will trust the Facebook/TikTok platforms to do the final deduplication
    // provided we send the exact same 'eventId' (which our frontend script now generates).
    
    // 2. Enrichment
    // Add server-side context (IP geolocation, User Agent parsing)
    
    // 3. Persist Event (Log)
    // We save the event before routing to ensure we have a record even if destinations fail
    const savedEvent = await prisma.trackingEvent.create({
      data: {
        datasetId,
        eventId: eventId || this.generateEventId(eventName, eventData, timestamp),
        eventName,
        eventData: eventData || {},
        url: url || '',
        userAgent: userAgent || '',
        status: 'PROCESSED'
      }
    });

    // 4. Verification (Update Source Status)
    // If we receive an event, it means the Pixel Script is working.
    // We update any PENDING Pixel Script sources to ACTIVE.
    await prisma.trackingSource.updateMany({
      where: {
        datasetId,
        status: 'PENDING',
        type: 'PIXEL_SCRIPT'
      },
      data: {
        status: 'ACTIVE'
      }
    });

    // 5. Routing (Fan-out)
    const dataset = await prisma.trackingDataset.findUnique({
      where: { id: datasetId },
      include: { destinations: true }
    });
    
    if (!dataset) return;

    const promises = dataset.destinations
      .filter(dest => dest.enabled)
      .map(async dest => {
          // Create delivery record
          const delivery = await prisma.trackingEventDelivery.create({
              data: {
                  eventId: savedEvent.id,
                  destinationId: dest.id,
                  datasetId: datasetId,
                  status: 'PENDING'
              }
          });
          
          return this.sendToDestination(dest, event, delivery.id);
      });
      
    await Promise.allSettled(promises);
  }

  private async sendToDestination(destination: any, event: any, deliveryId: string) {
    try {
        let result = { success: false, code: 0, body: '' };

        if (destination.platform === 'META') {
            result = await this.sendToMetaCAPI(destination.config, event);
        }
        // Add other platforms here

        // Update delivery status
        await prisma.trackingEventDelivery.update({
            where: { id: deliveryId },
            data: {
                status: result.success ? 'SUCCESS' : 'FAILED',
                responseCode: result.code,
                responseBody: result.body
            }
        });

    } catch (err: any) {
        console.error(`Failed to send to ${destination.platform}`, err);
        await prisma.trackingEventDelivery.update({
            where: { id: deliveryId },
            data: {
                status: 'FAILED',
                responseCode: 500,
                responseBody: err.message
            }
        });
    }
  }

  private async sendToMetaCAPI(config: any, event: any): Promise<{success: boolean, code: number, body: string}> {
      if (!config.pixelId || !config.apiToken) {
          console.warn('[Meta CAPI] Missing Pixel ID or API Token');
          return { success: false, code: 400, body: 'Missing Pixel ID or API Token' };
      }

      // Map event to Meta CAPI format
      // https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
      
      const userData: any = {
          client_ip_address: event.clientIp,
          client_user_agent: event.userAgent,
          fbc: event.eventData.fbc || undefined,
          fbp: event.eventData.fbp || undefined,
      };

      // Hash sensitive data if present in eventData
      if (event.eventData.email) userData.em = this.hashData(event.eventData.email);
      if (event.eventData.phone) userData.ph = this.hashData(event.eventData.phone);
      if (event.eventData.firstName) userData.fn = this.hashData(event.eventData.firstName);
      if (event.eventData.lastName) userData.ln = this.hashData(event.eventData.lastName);
      if (event.eventData.city) userData.ct = this.hashData(event.eventData.city);
      if (event.eventData.state) userData.st = this.hashData(event.eventData.state);
      if (event.eventData.zip) userData.zp = this.hashData(event.eventData.zip);
      if (event.eventData.country) userData.country = this.hashData(event.eventData.country);
      if (event.eventData.externalId) userData.external_id = this.hashData(event.eventData.externalId);

      const payload = {
          data: [
              {
                  event_name: event.eventName,
                  event_time: Math.floor(Date.now() / 1000),
                  event_id: event.eventId,
                  event_source_url: event.url,
                  action_source: 'website',
                  user_data: userData,
                  custom_data: {
                      ...event.eventData,
                      currency: event.eventData.currency || 'BRL',
                      value: event.eventData.value
                  }
              }
          ],
          // test_event_code: 'TEST12345' // Optional: for testing in Events Manager
      };

      try {
          const response = await fetch(`https://graph.facebook.com/v19.0/${config.pixelId}/events?access_token=${config.apiToken}`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
          });

          const data = await response.json();
          const body = JSON.stringify(data);
          
          if (!response.ok) {
              console.error('[Meta CAPI] Error:', body);
              return { success: false, code: response.status, body };
          } else {
              console.log(`[Meta CAPI] Success: ${event.eventName} sent to Pixel ${config.pixelId}`);
              return { success: true, code: response.status, body };
          }
      } catch (error: any) {
          console.error('[Meta CAPI] Network Error:', error);
          return { success: false, code: 0, body: error.message };
      }
  }

  // Source Management
  async addSource(
    userId: string,
    datasetId: string,
    type: SourceType,
    name: string,
    provider?: WebhookProvider,
    config?: any
  ) {
    const dataset = await this.getDatasetById(userId, datasetId);
    if (!dataset) throw new Error("Dataset not found");

    return prisma.trackingSource.create({
      data: {
        datasetId,
        type,
        name,
        provider,
        config: config || {},
        enabled: true
      }
    });
  }

  async updateSource(
    userId: string,
    sourceId: string,
    data: { enabled?: boolean, config?: any, name?: string }
  ) {
    const source = await prisma.trackingSource.findUnique({
      where: { id: sourceId },
      include: { dataset: true }
    });

    if (!source || source.dataset.userId !== userId) {
      throw new Error("Source not found or access denied");
    }

    return prisma.trackingSource.update({
      where: { id: sourceId },
      data
    });
  }

  async deleteSource(userId: string, sourceId: string) {
    const source = await prisma.trackingSource.findUnique({
      where: { id: sourceId },
      include: { dataset: true }
    });

    if (!source || source.dataset.userId !== userId) {
      throw new Error("Source not found or access denied");
    }

    return prisma.trackingSource.delete({
      where: { id: sourceId }
    });
  }
}
