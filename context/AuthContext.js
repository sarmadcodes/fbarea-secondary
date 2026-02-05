// context/AuthContext.js - Production-optimized
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const DEBUG = __DEV__;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');

      if (token && userString) {
        const userData = JSON.parse(userString);
        if (DEBUG) console.log('[AUTH_CONTEXT] User found:', userData.fullName);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[AUTH_CONTEXT] Check auth error:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (cnicNumber, password) => {
    try {
      const response = await authService.login(cnicNumber, password);
      
      if (response && response.user) {
        if (DEBUG) console.log('[AUTH_CONTEXT] Login successful:', response.user.fullName);
        setUser(response.user);
        return { success: true, data: response };
      } else {
        return { 
          success: false, 
          error: response?.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('[AUTH_CONTEXT] Login error:', error.message);
      
      let errorMessage = 'An error occurred during login';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      setUser(null);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      await authService.logout();
      
      if (DEBUG) console.log('[AUTH_CONTEXT] Logout complete');
      
    } catch (error) {
      console.error('[AUTH_CONTEXT] Logout error:', error.message);
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateUser = async () => {
    if (isLoggingOut) {
      return;
    }
    
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('[AUTH_CONTEXT] Update user error:', error.message);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isLoggingOut,
        login, 
        logout, 
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};