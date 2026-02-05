// services/guestRequestService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class GuestRequestService {
  async getMyGuestRequests() {
    try {
      const response = await apiClient.get('/guest-requests');
      if (DEBUG) console.log('[GUEST_SERVICE] Guest requests loaded:', response.count || 0);
      return response;
    } catch (error) {
      console.error('[GUEST_SERVICE] Failed to load guest requests:', error.message);
      throw error;
    }
  }

  async getGuestRequest(id) {
    try {
      const response = await apiClient.get(`/guest-requests/${id}`);
      return response;
    } catch (error) {
      console.error('[GUEST_SERVICE] Failed to load guest request:', error.message);
      throw error;
    }
  }

  async createGuestRequest(guestRequestData) {
    try {
      const response = await apiClient.post('/guest-requests', guestRequestData);
      if (DEBUG) console.log('[GUEST_SERVICE] Guest request created');
      return response;
    } catch (error) {
      console.error('[GUEST_SERVICE] Failed to create guest request:', error.message);
      throw error;
    }
  }

  async deleteGuestRequest(id) {
    try {
      const response = await apiClient.delete(`/guest-requests/${id}`);
      return response;
    } catch (error) {
      console.error('[GUEST_SERVICE] Failed to delete guest request:', error.message);
      throw error;
    }
  }

  async getGuestRequestStats() {
    try {
      const response = await apiClient.get('/guest-requests/stats');
      return response;
    } catch (error) {
      console.error('[GUEST_SERVICE] Failed to load stats:', error.message);
      throw error;
    }
  }
}

export default new GuestRequestService();