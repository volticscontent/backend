import axios from 'axios';

export class MetaAdsService {
  private appId: string;
  private appSecret: string;
  private apiVersion: string = 'v18.0';

  constructor() {
    this.appId = process.env.META_APP_ID || '';
    this.appSecret = process.env.META_APP_SECRET || '';
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    const scope = 'ads_management,ads_read,read_insights'; // Adjust scopes as needed
    let url = `https://www.facebook.com/${this.apiVersion}/dialog/oauth?client_id=${this.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
    
    if (state) {
      url += `&state=${state}`;
    }
    
    return url;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.apiVersion}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          redirect_uri: redirectUri,
          client_secret: this.appSecret,
          code: code,
        },
      });

      return response.data.access_token;
    } catch (error: any) {
      console.error('Error exchanging code for token:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for token');
    }
  }

  async getAdAccounts(accessToken: string) {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.apiVersion}/me/adaccounts`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,account_id,currency,account_status',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching ad accounts:', error.response?.data || error.message);
      throw new Error('Failed to fetch ad accounts');
    }
  }

  async getCampaigns(accessToken: string, accountId: string) {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.apiVersion}/${accountId}/campaigns`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,status,objective,start_time,stop_time,daily_budget,lifetime_budget',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching campaigns:', error.response?.data || error.message);
      throw new Error('Failed to fetch campaigns');
    }
  }
}
