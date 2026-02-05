// services/paymentService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class PaymentService {
  async getMyPayments() {
    return await apiClient.get('/payments');
  }

  async getPaymentByMonth(month) {
    return await apiClient.get(`/payments/month/${month}`);
  }

  async submitPaymentProof(paymentId, imageUri, transactionId = '', remarks = '', onProgress) {
    try {
      if (onProgress) onProgress('Preparing upload...');
      
      const formData = new FormData();
      
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('paymentProof', {
        uri: imageUri,
        type: type,
        name: filename || 'payment-proof.jpg',
      });

      if (transactionId?.trim()) {
        formData.append('transactionId', transactionId.trim());
      }

      if (remarks?.trim()) {
        formData.append('remarks', remarks.trim());
      }

      if (onProgress) onProgress('Uploading payment proof...');
      
      const response = await apiClient.post(`/payments/${paymentId}/submit`, formData);
      
      if (onProgress) onProgress('Upload complete!');
      
      if (DEBUG) console.log('[PAYMENT] Payment proof submitted');
      return response;
      
    } catch (error) {
      console.error('[PAYMENT] Submit error:', error.message);
      throw error;
    }
  }

  async getPaymentStats() {
    return await apiClient.get('/payments/stats');
  }

  async getPaymentHistory(limit = 10) {
    return await apiClient.get(`/payments/history?limit=${limit}`);
  }

  async getAvailableMonths() {
    return await apiClient.get('/payments/available-months');
  }

  async generatePayments() {
    return await apiClient.post('/payments/generate');
  }

  async getBankDetails() {
    return await apiClient.get('/payments/bank-details');
  }

  async cancelPaymentSubmission(paymentId) {
    return await apiClient.put(`/payments/${paymentId}/cancel`);
  }
}

export default new PaymentService();