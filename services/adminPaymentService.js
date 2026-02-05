// services/adminPaymentService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class AdminPaymentService {
  async getAllPayments(params = {}) {
    try {
      const response = await apiClient.get('/admin/payments', params);
      if (DEBUG) console.log('[ADMIN_PAYMENT] Fetched', response.data?.length || 0, 'payments');
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error fetching payments:', error.message);
      throw error;
    }
  }

  async getPaymentById(paymentId) {
    try {
      const response = await apiClient.get(`/admin/payments/${paymentId}`);
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error fetching payment:', error.message);
      throw error;
    }
  }

  async approvePayment(paymentId, adminNotes = '') {
    try {
      const response = await apiClient.put(`/admin/payments/${paymentId}/approve`, {
        adminNotes: adminNotes.trim(),
      });
      if (DEBUG) console.log('[ADMIN_PAYMENT] Payment approved');
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error approving payment:', error.message);
      throw error;
    }
  }

  async rejectPayment(paymentId, rejectionReason, adminNotes = '') {
    try {
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters');
      }

      const response = await apiClient.put(`/admin/payments/${paymentId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim(),
      });
      
      if (DEBUG) console.log('[ADMIN_PAYMENT] Payment rejected');
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error rejecting payment:', error.message);
      throw error;
    }
  }

  async getPaymentStats() {
    try {
      const response = await apiClient.get('/admin/payments/stats/overview');
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error fetching stats:', error.message);
      throw error;
    }
  }

  async getMonthlyStats(year) {
    try {
      const response = await apiClient.get('/admin/payments/stats/monthly', { year });
      return response;
    } catch (error) {
      console.error('[ADMIN_PAYMENT] Error fetching monthly stats:', error.message);
      throw error;
    }
  }
}

export default new AdminPaymentService();