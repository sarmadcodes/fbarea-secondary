// services/notificationService.js - Optimized with reduced polling
import apiClient from './apiClient';
import Constants from 'expo-constants';

const DEBUG = __DEV__;
const isExpoGo = Constants.appOwnership === 'expo';

let Notifications = null;
let Device = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (error) {
    if (DEBUG) console.log('[NotifService] Could not load notification modules');
  }
}

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.pushNotificationsEnabled = !isExpoGo && Notifications && Device;
    
    this.pollingInterval = null;
    // OPTIMIZED: Reduced from 15s to 30s - reduces server load by 50%
    this.pollingIntervalMs = 30000;
    this.pollingCallbacks = [];
    
    // Cache to prevent unnecessary updates
    this.lastNotificationCount = 0;
    this.lastAnnouncementCount = 0;
    this.lastUnreadCount = 0;
    
    // Add request deduplication
    this.pendingRequests = new Map();
  }

  configure() {
    if (!this.pushNotificationsEnabled) {
      if (DEBUG) console.log('[NotifService] Push notifications not available');
      this.isInitialized = true;
      return;
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      this.isInitialized = true;
      if (DEBUG) console.log('[NotifService] Handler configured');
    } catch (error) {
      console.error('[NotifService] Configuration error:', error.message);
      this.isInitialized = false;
    }
  }

  async registerForPushNotifications() {
    if (!this.pushNotificationsEnabled) {
      if (DEBUG) console.log('[NotifService] Push notifications disabled');
      return null;
    }

    if (!Device.isDevice) {
      if (DEBUG) console.log('[NotifService] Physical device required');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (DEBUG) console.log('[NotifService] Permission denied');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('[NotifService] Missing project ID');
        return null;
      }

      let token = null;
      for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          token = tokenData.data;
          if (DEBUG) console.log('[NotifService] Token obtained');
          break;
        } catch (tokenError) {
          if (attempt === this.retryAttempts) {
            console.error('[NotifService] Token error:', tokenError.message);
          }
          if (attempt < this.retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          }
        }
      }
      
      if (token) {
        await this.registerTokenWithBackend(token);
      }

      return token;
    } catch (error) {
      console.error('[NotifService] Registration error:', error.message);
      return null;
    }
  }

  async registerTokenWithBackend(pushToken) {
    if (!pushToken || typeof pushToken !== 'string') {
      return null;
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await apiClient.post('/notifications/register-token', { 
          pushToken: pushToken.trim() 
        });
        if (DEBUG) console.log('[NotifService] Token registered');
        return true;
      } catch (error) {
        if (attempt === this.retryAttempts) {
          console.error('[NotifService] Token registration failed:', error.message);
        }
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    return null;
  }

  startPolling(callback) {
    if (callback && typeof callback === 'function') {
      this.pollingCallbacks.push(callback);
    }
    
    this.stopPolling();
    this.pollForUpdates();
    
    this.pollingInterval = setInterval(() => {
      this.pollForUpdates();
    }, this.pollingIntervalMs);
    
    if (DEBUG) console.log('[NotifService] Polling started (30s interval)');
  }

  async pollForUpdates() {
    try {
      // OPTIMIZED: Use Promise.all instead of Promise.allSettled for faster execution
      const [notificationsResponse, announcements, unreadData] = await Promise.all([
        this.getNotifications(1, 20).catch(() => ({ success: false, data: [] })),
        this.getAnnouncements(1, 10).catch(() => []),
        this.getUnreadCount().catch(() => ({ success: false, data: { count: 0 } })),
      ]);
      
      const notifications = notificationsResponse?.data || [];
      const unreadCount = unreadData?.data?.count || 0;
      
      const hasNewNotifications = notifications.length > this.lastNotificationCount;
      const hasNewAnnouncements = announcements.length > this.lastAnnouncementCount;
      const unreadChanged = unreadCount !== this.lastUnreadCount;
      
      // Only update and notify if there are actual changes
      if (hasNewNotifications || hasNewAnnouncements || unreadChanged) {
        this.lastNotificationCount = notifications.length;
        this.lastAnnouncementCount = announcements.length;
        this.lastUnreadCount = unreadCount;
        
        // Only call callbacks if there are changes
        this.pollingCallbacks.forEach(cb => {
          try {
            cb({
              notifications,
              announcements,
              unreadCount,
              hasChanges: true,
            });
          } catch (error) {
            console.error('[NotifService] Callback error:', error.message);
          }
        });
      }
      
    } catch (error) {
      console.error('[NotifService] Polling error:', error.message);
    }
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.pollingCallbacks = [];
      
      this.lastNotificationCount = 0;
      this.lastAnnouncementCount = 0;
      this.lastUnreadCount = 0;
      
      if (DEBUG) console.log('[NotifService] Polling stopped');
    }
  }

  // OPTIMIZED: Add request deduplication to prevent duplicate API calls
  async deduplicatedRequest(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }

  async getNotifications(page = 1, limit = 20, filters = {}) {
    const requestKey = `notifications-${page}-${limit}-${JSON.stringify(filters)}`;
    
    return this.deduplicatedRequest(requestKey, async () => {
      try {
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
        
        const params = { page: validPage, limit: validLimit };
        
        if (filters.type) params.type = filters.type;
        if (filters.isRead !== undefined) params.isRead = filters.isRead;

        const response = await apiClient.get('/notifications', params);
        
        if (!response || !response.success) {
          throw new Error('Invalid response');
        }
        
        return response;
      } catch (error) {
        console.error('[NotifService] Get notifications error:', error.message);
        return {
          success: false,
          count: 0,
          total: 0,
          pages: 0,
          currentPage: page,
          data: [],
          error: error.message,
        };
      }
    });
  }

  async getAnnouncements(page = 1, limit = 20) {
    const requestKey = `announcements-${page}-${limit}`;
    
    return this.deduplicatedRequest(requestKey, async () => {
      try {
        const validPage = Math.max(1, parseInt(page) || 1);
        const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
        
        const params = { page: validPage, limit: validLimit };
        
        const response = await apiClient.get('/notifications/announcements', params);
        
        if (!response || !response.success) {
          return [];
        }
        
        return response.data || [];
      } catch (error) {
        console.error('[NotifService] Get announcements error:', error.message);
        return [];
      }
    });
  }

  async getUnreadCount() {
    return this.deduplicatedRequest('unread-count', async () => {
      try {
        const response = await apiClient.get('/notifications/unread-count');
        
        if (!response || !response.success) {
          throw new Error('Invalid response');
        }
        
        return response;
      } catch (error) {
        console.error('[NotifService] Unread count error:', error.message);
        return { success: false, data: { count: 0 } };
      }
    });
  }

  async markAsRead(notificationId) {
    try {
      if (!notificationId) throw new Error('Invalid notification ID');
      
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      
      if (!response || !response.success) {
        throw new Error('Failed to mark as read');
      }
      
      return response;
    } catch (error) {
      console.error('[NotifService] Mark as read error:', error.message);
      throw error;
    }
  }

  async markAllAsRead() {
    try {
      const response = await apiClient.put('/notifications/read-all');
      
      if (!response || !response.success) {
        throw new Error('Failed to mark all as read');
      }
      
      return response;
    } catch (error) {
      console.error('[NotifService] Mark all as read error:', error.message);
      throw error;
    }
  }

  async deleteNotification(notificationId) {
    try {
      if (!notificationId) throw new Error('Invalid notification ID');
      
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      
      if (!response || !response.success) {
        throw new Error('Failed to delete');
      }
      
      return response;
    } catch (error) {
      console.error('[NotifService] Delete error:', error.message);
      throw error;
    }
  }

  addNotificationListener(callback) {
    if (!this.pushNotificationsEnabled) {
      if (DEBUG) console.log('[NotifService] Listeners not available');
      return null;
    }

    try {
      const subscription = Notifications.addNotificationReceivedListener(callback);
      return subscription;
    } catch (error) {
      console.error('[NotifService] Add listener error:', error.message);
      return null;
    }
  }

  addNotificationResponseListener(callback) {
    if (!this.pushNotificationsEnabled) {
      if (DEBUG) console.log('[NotifService] Response listeners not available');
      return null;
    }

    try {
      const subscription = Notifications.addNotificationResponseReceivedListener(callback);
      return subscription;
    } catch (error) {
      console.error('[NotifService] Add response listener error:', error.message);
      return null;
    }
  }

  removeNotificationListener(subscription) {
    if (!subscription || !this.pushNotificationsEnabled) return;
    
    try {
      Notifications.removeNotificationSubscription(subscription);
    } catch (error) {
      console.error('[NotifService] Remove listener error:', error.message);
    }
  }
}

export default new NotificationService();