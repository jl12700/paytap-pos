const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

class PayTapAPI {
  constructor() {
    this.baseURL = API_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend unreachable:', error);
      return false;
    }
  }

  // Search card by RFID UID
  async searchCard(rfidUid) {
    return this.request('/api/rfid/search', {
      method: 'POST',
      body: JSON.stringify({ rfid_uid: rfidUid })
    });
  }

  // Deduct balance (main transaction method)
  async deductBalance(rfidUid, amount, reason = 'Purchase') {
    return this.request('/api/rfid/deduct', {
      method: 'POST',
      body: JSON.stringify({
        rfid_uid: rfidUid,
        amount: amount,
        reason: reason
      })
    });
  }

  // Get card info
  async getCard(rfidUid) {
    return this.request(`/api/rfid/${rfidUid}`);
  }
}

export const api = new PayTapAPI();