// context/AdminAuthContext.jsx - Production-optimized
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import adminAuthService from '../services/adminAuthService';

const DEBUG = __DEV__;
const AdminAuthContext = createContext({});

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const adminData = await AsyncStorage.getItem('adminUser');
      
      if (token && adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        if (DEBUG) console.log('[ADMIN_AUTH_CONTEXT] Admin authenticated:', parsedAdmin.fullName);
      }
    } catch (error) {
      console.error('[ADMIN_AUTH_CONTEXT] Error checking admin auth:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (cnicNumber, password) => {
    try {
      const response = await adminAuthService.login(cnicNumber, password);
      
      if (response.success && response.data?.admin) {
        setAdmin(response.data.admin);
        if (DEBUG) console.log('[ADMIN_AUTH_CONTEXT] Admin login successful:', response.data.admin.fullName);
        return { success: true, admin: response.data.admin };
      }
      
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('[ADMIN_AUTH_CONTEXT] Login error:', error.message);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logoutAdmin = async () => {
    try {
      setIsLoggingOut(true);
      await adminAuthService.logout();
      setAdmin(null);
      
      if (DEBUG) console.log('[ADMIN_AUTH_CONTEXT] Admin logged out');
      return { success: true };
    } catch (error) {
      console.error('[ADMIN_AUTH_CONTEXT] Logout error:', error.message);
      setAdmin(null);
      return { success: true };
    } finally {
      setIsLoggingOut(false);
    }
  };

  const value = {
    admin,
    loading,
    isLoggingOut,
    loginAdmin,
    logoutAdmin,
    isAdminAuthenticated: !!admin,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};