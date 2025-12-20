import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class DataService {
  constructor() {
    try {
      this.api = axios.create({
        baseURL: API_BASE_URL,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error('Failed to initialize axios:', e);
      this.api = null;
    }
  }

  // Get latest IPO data (from cache or fresh fetch)
  async getLatestIPOData() {
    if (!this.api) return [];
    
    try {
      // Try the realtime endpoint first
      const response = await this.api.get('/api/realtime-ipo/latest-data');
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching latest IPO data:', error.message);
      
      // Try fallback endpoint
      try {
        const fallbackResponse = await this.api.get('/ipos');
        if (Array.isArray(fallbackResponse.data)) {
          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.warn('Fallback fetch failed:', fallbackError.message);
      }
      
      // Return empty array instead of throwing, so UI can handle "empty state"
      return [];
    }
  }

  // Force refresh data from source
  async refreshData() {
    if (!this.api) throw new Error('API not initialized');
    
    try {
      const response = await this.api.post('/api/realtime-ipo/fetch-now');
      return response.data;
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  }

  // Get market sentiment from Gemini service
  async getMarketSentiment() {
    if (!this.api) return null;
    
    try {
      const response = await this.api.get('/api/gemini-ipo/market-sentiment');
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching market sentiment:', error);
      return null;
    }
  }

  // Get service status
  async getServiceStatus() {
    if (!this.api) return null;
    
    try {
      const response = await this.api.get('/api/realtime-ipo/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching service status:', error);
      return null;
    }
  }
}

export const dataService = new DataService();
export default dataService;