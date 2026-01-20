import prisma from "../lib/prisma";
import crypto from 'crypto';

export class MarketingService {
  async getSettings(userId: string) {
    return prisma.marketingSettings.findUnique({
      where: { userId },
    });
  }

  async updateSettings(userId: string, metaPixelId: string, metaApiToken: string) {
    return prisma.marketingSettings.upsert({
      where: { userId },
      update: {
        metaPixelId,
        metaApiToken,
      },
      create: {
        userId,
        metaPixelId,
        metaApiToken,
      },
    });
  }

  generatePixelScript(pixelId: string, endpointUrl: string) {
    return `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '${pixelId}');
fbq('track', 'PageView');

// Proxy Event Listener for CAPI
(function() {
  const originalFbq = window.fbq;
  window.fbq = function() {
    originalFbq.apply(this, arguments);
    const args = Array.from(arguments);
    const eventName = args[0] === 'track' ? args[1] : null;
    const eventData = args[2] || {};
    
    if (eventName && ['track', 'trackCustom'].includes(args[0])) {
      const payload = {
        eventName,
        eventData,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Math.floor(Date.now() / 1000),
        eventId: 'evt_' + Math.random().toString(36).substr(2, 9) // Simple ID generation
      };
      
      // Fire and forget to CAPI Proxy
      fetch('${endpointUrl}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(console.error);
    }
  };
  // Copy properties
  Object.keys(originalFbq).forEach(key => window.fbq[key] = originalFbq[key]);
})();
    `;
  }

  async sendToCAPI(userId: string, eventData: any, clientIp: string) {
    const settings = await this.getSettings(userId);
    if (!settings?.metaPixelId || !settings?.metaApiToken) return;

    const body = {
      data: [
        {
          event_name: eventData.eventName,
          event_time: eventData.timestamp,
          event_id: eventData.eventId, // Deduplication key
          action_source: "website",
          event_source_url: eventData.url,
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: eventData.userAgent,
            // Add other hashed user data here if available in eventData
          },
          custom_data: eventData.eventData,
        }
      ],
      access_token: settings.metaApiToken
    };

    const url = `https://graph.facebook.com/v19.0/${settings.metaPixelId}/events?access_token=${settings.metaApiToken}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('CAPI Error:', JSON.stringify(error));
        throw new Error(`CAPI Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('CAPI Network Error:', error);
      throw error;
    }
  }
}
