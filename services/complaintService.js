// services/complaintService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class ComplaintService {
  async getMyComplaints() {
    return await apiClient.get('/complaints');
  }

  async getComplaint(id) {
    return await apiClient.get(`/complaints/${id}`);
  }

  async createComplaint(complaintData) {
    if (complaintData instanceof FormData) {
      if (DEBUG) console.log('[ComplaintService] Sending complaint with image');
      return await apiClient.post('/complaints', complaintData);
    } else {
      return await apiClient.post('/complaints', complaintData);
    }
  }

  async updateComplaint(id, complaintData) {
    return await apiClient.put(`/complaints/${id}`, complaintData);
  }

  async deleteComplaint(id) {
    return await apiClient.delete(`/complaints/${id}`);
  }

  async getComplaintStats() {
    return await apiClient.get('/complaints/stats');
  }

  async getRecentComplaints() {
    return await apiClient.get('/complaints/recent');
  }
}

export default new ComplaintService();