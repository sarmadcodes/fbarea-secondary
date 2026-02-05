// services/adminAuthService.js - Production-optimized
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

const DEBUG = __DEV__;

class AdminAuthService {
  async login(cnicNumber, password) {
    try {
      const response = await apiClient.post('/admin/auth/login', {
        cnicNumber: cnicNumber.trim(),
        password: password.trim(),
      });

      if (response.success && response.data?.token) {
        await AsyncStorage.setItem('adminToken', response.data.token);
        await AsyncStorage.setItem('adminUser', JSON.stringify(response.data.admin));
        
        if (DEBUG) console.log('[ADMIN_AUTH] Login successful');
        return response;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('[ADMIN_AUTH] Login failed:', error.message);
      throw error;
    }
  }

  async getProfile() {
    try {
      const response = await apiClient.get('/admin/auth/me');
      
      if (response.success && response.data) {
        await AsyncStorage.setItem('adminUser', JSON.stringify(response.data));
        if (DEBUG) console.log('[ADMIN_AUTH] Profile loaded');
        return response;
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('[ADMIN_AUTH] Failed to fetch profile:', error.message);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove(['adminToken', 'adminUser']);
      if (DEBUG) console.log('[ADMIN_AUTH] Logout successful');
    } catch (error) {
      console.error('[ADMIN_AUTH] Logout error:', error.message);
      await AsyncStorage.multiRemove(['adminToken', 'adminUser']);
    }
  }

  async isAdminLoggedIn() {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      return !!token;
    } catch (error) {
      console.error('[ADMIN_AUTH] Error checking login status:', error.message);
      return false;
    }
  }

  async getAdminToken() {
    try {
      return await AsyncStorage.getItem('adminToken');
    } catch (error) {
      console.error('[ADMIN_AUTH] Error getting token:', error.message);
      return null;
    }
  }

  async getAdminUser() {
    try {
      const userJson = await AsyncStorage.getItem('adminUser');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('[ADMIN_AUTH] Error getting user:', error.message);
      return null;
    }
  }
}

export default new AdminAuthService();