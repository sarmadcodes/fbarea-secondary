// services/apiClient.js - Production-optimized with conditional logging
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../constants/api';

// Enable detailed logs only in development
const DEBUG = __DEV__;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 60000;
    this.uploadTimeout = 180000;
    this.abortController = new AbortController();
    
    if (DEBUG) {
      console.log('[API_CLIENT] Initialized with baseURL:', this.baseURL);
    }
  }

  cancelAllRequests() {
    if (DEBUG) console.log('[API_CLIENT] Cancelling all pending requests');
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async getToken(endpoint) {
    try {
      if (endpoint.includes('/admin/')) {
        return await AsyncStorage.getItem('adminToken');
      }
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('[API_CLIENT] Token error:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken(endpoint);

    // Only log in development mode
    if (DEBUG) {
      console.log(`[API_CLIENT] ${options.method || 'GET'} ${endpoint}`);
    }

    const isAuthRoute = endpoint.includes('/auth/login') || 
                       endpoint.includes('/auth/register') || 
                       endpoint.includes('/health');
    
    if (!isAuthRoute && !token) {
      const error = new Error('Not authenticated');
      error.response = { status: 401 };
      throw error;
    }

    const headers = {};
    
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      body: options.body,
      signal: this.abortController.signal,
    };

    try {
      const timeoutDuration = options.body instanceof FormData ? this.uploadTimeout : this.timeout;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutDuration);
      });

      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (DEBUG) console.error('[API_CLIENT] Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned invalid response');
      }

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}`);
        error.response = {
          status: response.status,
          data: data,
        };
        
        if (data.errors && Array.isArray(data.errors)) {
          error.validationErrors = data.errors;
          const errorMessages = data.errors
            .map(err => err.message || `${err.field}: validation failed`)
            .join(', ');
          
          if (errorMessages) {
            error.message = errorMessages;
          }
        }
        
        throw error;
      }

      if (DEBUG) {
        console.log(`[API_CLIENT] Success ${options.method || 'GET'} ${endpoint}`);
      }
      
      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        if (DEBUG) console.log('[API_CLIENT] Request aborted:', endpoint);
        throw error;
      }

      // Only log errors in production
      console.error('[API_CLIENT] Request failed:', endpoint, error.message);

      if (error.message === 'Network request failed') {
        error.message = 'Cannot connect to server. Check your internet connection.';
      } else if (error.message === 'Request timeout') {
        error.message = 'Request timed out. Please try again.';
      } else if (error.response?.status === 401) {
        if (!endpoint.includes('/login')) {
          error.message = 'Session expired. Please login again.';
          
          if (endpoint.includes('/admin/')) {
            await AsyncStorage.multiRemove(['adminToken', 'adminUser']);
          } else {
            await AsyncStorage.multiRemove(['token', 'user']);
          }
        }
      } else if (error.response?.status >= 500) {
        error.message = 'Server error. Please try again later.';
      }

      throw error;
    }
  }

  get(endpoint, params) {
    let url = endpoint;
    
    if (params) {
      const queryString = Object.keys(params)
        .filter(key => params[key] != null)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      if (queryString) url += `?${queryString}`;
    }
    
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async healthCheck() {
    try {
      if (DEBUG) console.log('[API_CLIENT] Health check:', this.baseURL);
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const isHealthy = response.ok;
      if (DEBUG) console.log('[API_CLIENT] Backend status:', isHealthy ? 'healthy' : 'unhealthy');
      
      return isHealthy;
    } catch (error) {
      console.error('[API_CLIENT] Health check failed:', error.message);
      return false;
    }
  }
}

export default new ApiClient();