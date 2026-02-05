// services/dealsService.js - Production-optimized
import apiClient from './apiClient';

const DEBUG = __DEV__;

class DealsService {
  async getDeals(params = {}) {
    try {
      const queryParams = {
        ...params,
        status: 'active',
      };
      
      const response = await apiClient.get('/deals', queryParams);
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get deals error:', error.message);
      throw error;
    }
  }

  async getDealById(dealId) {
    try {
      const response = await apiClient.get(`/deals/${dealId}`);
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get deal by ID error:', error.message);
      throw error;
    }
  }

  async getFeaturedDeals() {
    try {
      const response = await apiClient.get('/deals/featured');
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get featured deals error:', error.message);
      throw error;
    }
  }

  async getCategories() {
    try {
      const response = await apiClient.get('/deal-categories');
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get categories error:', error.message);
      throw error;
    }
  }

  async getCouponsByDeal(dealId) {
    try {
      const response = await apiClient.get(`/deals/${dealId}/coupons`);
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get coupons error:', error.message);
      throw error;
    }
  }

  async claimCoupon(couponId) {
    try {
      const response = await apiClient.post(`/coupons/${couponId}/claim`);
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Claim coupon error:', error.message);
      throw error;
    }
  }

  async getMyCoupons(params = {}) {
    try {
      const response = await apiClient.get('/coupons/my-coupons', params);
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Get my coupons error:', error.message);
      throw error;
    }
  }

  async verifyCoupon(verificationCode) {
    try {
      const response = await apiClient.post('/coupons/verify', { verificationCode });
      return response.data || response;
    } catch (error) {
      console.error('[DEALS_SERVICE] Verify coupon error:', error.message);
      throw error;
    }
  }
}

export default new DealsService();