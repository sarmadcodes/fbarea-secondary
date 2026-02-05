import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Colors from '../../constants/Colors';
import userService from '../../services/userService';
import notificationService from '../../services/notificationService';
import { useCustomAlert } from '../../components/CustomAlert';

// ✅ TypeScript Interfaces
interface User {
  _id: string;
  fullName: string;
  email?: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'payment' | 'complaint' | 'announcement' | 'maintenance' | 'security';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // ✅ Cleanup on unmount
  useEffect(() => {
    console.log('🚀 Dashboard mounted');
    isMounted.current = true;
    abortController.current = new AbortController();
    
    initializeApp();
    
    return () => {
      console.log('📻 Dashboard unmounting - cleaning up');
      isMounted.current = false;
      
      if (abortController.current) {
        abortController.current.abort();
      }
      
      if (notificationListener.current) {
        notificationService.removeNotificationListener(notificationListener.current);
      }
      if (responseListener.current) {
        notificationService.removeNotificationListener(responseListener.current);
      }
      
      // ✅ Stop polling when unmounting
      notificationService.stopPolling();
    };
  }, []);

  // ✅ Auto-mark all as read when notification panel opens
  useEffect(() => {
    if (notificationsVisible && unreadCount > 0) {
      console.log('👁️ Notification panel opened - auto-marking all as read...');
      handleMarkAllAsReadSilently();
    }
  }, [notificationsVisible, unreadCount]);

  const initializeApp = async () => {
    try {
      console.log('📱 Initializing app...');
      await Promise.all([
        fetchUserData(),
        setupNotifications(),
        fetchNotifications(),
        fetchAnnouncements(),
      ]);
      
      // ✅ Start polling for live updates after initial load
      startLiveUpdates();
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error initializing app:', error);
      handleError(error, 'Failed to initialize dashboard');
    }
  };

  // ✅ IMPROVED: Start live updates with proper callback
  const startLiveUpdates = () => {
    console.log('🔄 Starting live updates...');
    
    notificationService.startPolling((data: any) => {
      if (!isMounted.current) return;
      
      console.log('🔔 Live update received:', {
        notifications: data.notifications?.length || 0,
        announcements: data.announcements?.length || 0,
        unreadCount: data.unreadCount,
        hasChanges: data.hasChanges,
      });
      
      // ✅ Update ALL notification types (not just announcements)
      if (data.notifications && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        console.log('📱 Updated notifications state');
      }
      
      if (data.announcements && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
        console.log('📢 Updated announcements state');
      }
      
      if (typeof data.unreadCount === 'number') {
        setUnreadCount(data.unreadCount);
        console.log('🔔 Updated unread count:', data.unreadCount);
      }
      
      // ✅ Optional: Show a subtle indicator when new notifications arrive
      if (data.hasChanges && data.unreadCount > unreadCount) {
        console.log('🆕 New notifications detected!');
        // The badge will automatically update due to state change
      }
    });
  };

  const setupNotifications = async () => {
    try {
      console.log('🔧 Setting up notifications...');
      notificationService.configure();

      const token = await notificationService.registerForPushNotifications();
      
      if (token) {
        console.log('✅ Push token registered');
      } else {
        console.log('ℹ️ Push notifications not available (using API polling)');
      }

      // ✅ Listen for foreground notifications (when app is open)
      notificationListener.current = notificationService.addNotificationListener((notification: any) => {
        console.log('📬 NEW NOTIFICATION (foreground):', notification);
        if (isMounted.current) {
          // Immediately fetch fresh data
          fetchNotifications();
          fetchAnnouncements();
          fetchUnreadCount();
        }
      });

      // ✅ Listen for notification taps (when user clicks notification)
      responseListener.current = notificationService.addNotificationResponseListener((response: any) => {
        console.log('👆 NOTIFICATION CLICKED:', response);
        if (response?.notification?.request?.content?.data && isMounted.current) {
          handleNotificationClick(response.notification.request.content.data);
        }
      });

      console.log('✅ Notification setup complete');
    } catch (error) {
      console.error('❌ Error setting up notifications:', error);
      // Don't show alert for notification setup failures
    }
  };

  const handleNotificationClick = useCallback((data: any) => {
    console.log('🔗 Handling notification click:', data);
    try {
      if (data?.type === 'payment') {
        router.push('/screens/accounts');
      } else if (data?.type === 'complaint') {
        router.push('/(tabs)/complaints');
      }
      // Add more navigation logic for other types if needed
    } catch (error) {
      console.error('❌ Error handling notification click:', error);
    }
  }, [router]);

  const fetchUserData = async () => {
    try {
      console.log('👤 Fetching user data...');
      setLoading(true);
      setError(null);
      
      const response = await userService.getProfile();
      
      if (!isMounted.current) return;
      
      if (response?.data?.user) {
        console.log('✅ User data loaded:', response.data.user.fullName);
        setUserData(response.data.user);
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error fetching user data:', error);
      handleError(error, 'Failed to load user profile');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('📥 Fetching notifications...');
      const response = await notificationService.getNotifications(1, 20);
      
      if (!isMounted.current) return;
      
      if (response?.success && Array.isArray(response.data)) {
        console.log(`✅ Loaded ${response.data.length} notifications`);
        setNotifications(response.data);
      } else {
        console.log('⚠️ No notifications data');
        setNotifications([]);
      }
      
      await fetchUnreadCount();
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      // Don't show alert for background fetch failures
    }
  };

  const fetchAnnouncements = async () => {
    try {
      console.log('📢 Fetching announcements...');
      const announcementData = await notificationService.getAnnouncements(1, 10);
      
      if (!isMounted.current) return;
      
      if (Array.isArray(announcementData)) {
        console.log(`✅ Loaded ${announcementData.length} announcements`);
        setAnnouncements(announcementData);
      } else {
        console.error('❌ Invalid announcement data format');
        setAnnouncements([]);
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error fetching announcements:', error);
      setAnnouncements([]);
      // Don't show alert for background fetch failures
    }
  };

  const fetchUnreadCount = async () => {
    try {
      console.log('📊 Fetching unread count...');
      const response = await notificationService.getUnreadCount();
      
      if (!isMounted.current) return;
      
      if (response?.success) {
        const count = response.data?.count || 0;
        console.log(`✅ Unread count: ${count}`);
        setUnreadCount(count);
      }
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error fetching unread count:', error);
      // Don't show alert for background fetch failures
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log('✓ Marking notification as read:', notificationId);
      await notificationService.markAsRead(notificationId);
      
      if (!isMounted.current) return;
      
      fetchNotifications();
      fetchAnnouncements();
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error marking as read:', error);
      // Silent failure for mark as read
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log('✓ Marking all notifications as read...');
      await notificationService.markAllAsRead();
      
      if (!isMounted.current) return;
      
      fetchNotifications();
      fetchAnnouncements();
      showAlert('Success', 'All notifications marked as read', [], 'success');
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error marking all as read:', error);
      showAlert('Error', 'Failed to mark all as read', [], 'error');
    }
  };

  const handleMarkAllAsReadSilently = async () => {
    try {
      console.log('✓ Auto-marking all notifications as read...');
      await notificationService.markAllAsRead();
      
      if (!isMounted.current) return;
      
      // Update local state immediately for better UX
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setAnnouncements(prev => prev.map(a => ({ ...a, isRead: true })));
      
      // Then fetch fresh data
      fetchNotifications();
      fetchAnnouncements();
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error auto-marking as read:', error);
      // Silent failure
    }
  };

  const handleAnnouncementClick = async (announcement: Notification) => {
    try {
      if (!announcement.isRead) {
        console.log('✓ Marking announcement as read:', announcement._id);
        await notificationService.markAsRead(announcement._id);
        
        if (!isMounted.current) return;
        
        setAnnouncements(prev => 
          prev.map(a => a._id === announcement._id ? { ...a, isRead: true } : a)
        );
        
        fetchUnreadCount();
      }
      
      handleNotificationClick(announcement);
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error marking announcement as read:', error);
      // Still navigate even if mark as read fails
      handleNotificationClick(announcement);
    }
  };

  const onRefresh = async () => {
    try {
      console.log('🔄 Refreshing dashboard...');
      setRefreshing(true);
      setError(null);
      
      await Promise.all([
        fetchUserData(),
        fetchNotifications(),
        fetchAnnouncements(),
      ]);
      
      console.log('✅ Refresh complete');
    } catch (error) {
      if (!isMounted.current) return;
      console.error('❌ Error refreshing:', error);
      handleError(error, 'Failed to refresh dashboard');
    } finally {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }
  };

  const handleError = (error: any, fallbackMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : fallbackMessage;
    setError(errorMessage);
    
    // Only show critical errors to user
    if (!error?.toString().includes('abort')) {
      console.error('Error:', errorMessage);
    }
  };

  const formatNotificationTime = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  }, []);

  const getNotificationIcon = useCallback((type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'payment':
        return 'wallet-outline';
      case 'complaint':
        return 'warning-outline';
      case 'announcement':
        return 'megaphone-outline';
      case 'maintenance':
        return 'construct-outline';
      case 'security':
        return 'shield-outline';
      default:
        return 'notifications-outline';
    }
  }, []);

  const getNotificationColor = useCallback((type: string) => {
    switch (type) {
      case 'payment':
        return '#4CAF50';
      case 'complaint':
        return '#FF9800';
      case 'announcement':
        return '#2196F3';
      case 'maintenance':
        return '#9C27B0';
      case 'security':
        return '#F44336';
      default:
        return Colors.primary;
    }
  }, []);

  const menuItems: MenuItem[] = useMemo(() => [
    { icon: 'card-outline', label: 'Digital Card', route: '/screens/digitalCard' },
    { icon: 'wallet-outline', label: 'Accounts', route: '/screens/accounts' },
    { icon: 'warning-outline', label: 'Complaints', route: '/(tabs)/complaints' },
    { icon: 'settings-outline', label: 'Settings', route: '/(tabs)/profile' },
  ], []);

  const getFirstName = useCallback(() => {
    if (!userData?.fullName) return '';
    const names = userData.fullName.split(' ');
    return names[0];
  }, [userData]);

  const handleQuickActionPress = useCallback((route: string) => {
    try {
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
      showAlert('Error', 'Failed to navigate to page', [], 'error');
    }
  }, [router]);

  const handleMenuItemPress = useCallback((route: string) => {
    try {
      setDrawerVisible(false);
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
      showAlert('Error', 'Failed to navigate to page', [], 'error');
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Custom Alert */}
      <AlertComponent />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => setDrawerVisible(true)}
            accessible={true}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
          >
            <Ionicons name="menu" size={28} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Block 13 FB</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setNotificationsVisible(true)}
            accessible={true}
            accessibilityLabel={`Notifications, ${unreadCount} unread`}
            accessibilityRole="button"
          >
            <View>
              <Ionicons name="notifications-outline" size={28} color={Colors.white} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* Banner */}
        <View style={styles.banner}>
          <LinearGradient
            colors={['#4CAF50', '#A5D6A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Text style={styles.bannerTitle}>
                  Welcome Back{userData?.fullName ? `, ${getFirstName()}!` : '!'}
                </Text>
                <Text style={styles.bannerSubtitle}>Your community at your fingertips</Text>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/screens/digitalCard')}
              accessible={true}
              accessibilityLabel="Digital Card"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="card-outline" size={28} color="#2196F3" />
              </View>
              <Text style={styles.actionLabel}>Digital Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/screens/accounts')}
              accessible={true}
              accessibilityLabel="Accounts"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="wallet-outline" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.actionLabel}>Accounts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/(tabs)/complaints')}
              accessible={true}
              accessibilityLabel="Complaints"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="warning-outline" size={28} color="#FF9800" />
              </View>
              <Text style={styles.actionLabel}>Complaints</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/screens/deals-discounts')}
              accessible={true}
              accessibilityLabel="Deals & Discounts"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FCE4EC' }]}>
                <Ionicons name="pricetags-outline" size={28} color="#E91E63" />
              </View>
              <Text style={styles.actionLabel}>Deals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/screens/guest-requests')}
              accessible={true}
              accessibilityLabel="Guest Requests"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="people-outline" size={28} color="#03A9F4" />
              </View>
              <Text style={styles.actionLabel}>Guests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleQuickActionPress('/(tabs)/profile')}
              accessible={true}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="settings-outline" size={28} color="#9C27B0" />
              </View>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Announcements</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(true)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {announcements.slice(0, 3).map((notif) => (
              <TouchableOpacity
                key={notif._id}
                style={styles.announcementCard}
                onPress={() => handleAnnouncementClick(notif)}
                accessible={true}
                accessibilityLabel={`${notif.title}, ${notif.isRead ? 'read' : 'unread'}`}
                accessibilityRole="button"
              >
                <View style={[
                  styles.announcementIcon,
                  { backgroundColor: `${getNotificationColor(notif.type)}20` }
                ]}>
                  <Ionicons 
                    name={getNotificationIcon(notif.type)} 
                    size={24} 
                    color={getNotificationColor(notif.type)} 
                  />
                </View>
                <View style={styles.announcementContent}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>{notif.title}</Text>
                    {!notif.isRead && <View style={styles.unreadIndicator} />}
                  </View>
                  <Text style={styles.announcementDescription} numberOfLines={2}>
                    {notif.message}
                  </Text>
                  <View style={styles.announcementFooter}>
                    <Text style={styles.announcementType}>
                      {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                    </Text>
                    <Text style={styles.announcementDate}>
                      {formatNotificationTime(notif.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {announcements.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>No Announcements Yet</Text>
            <Text style={styles.emptyStateText}>
              You'll see important announcements, maintenance updates, and security notices here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Drawer Modal */}
      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawer} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity 
                onPress={() => setDrawerVisible(false)}
                accessible={true}
                accessibilityLabel="Close menu"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.drawerItem}
                onPress={() => handleMenuItemPress(item.route)}
                accessible={true}
                accessibilityLabel={item.label}
                accessibilityRole="button"
              >
                <Ionicons name={item.icon} size={24} color={Colors.text} />
                <Text style={styles.drawerItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
        >
          <View style={styles.notificationsPanel} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Notifications</Text>
              <TouchableOpacity 
                onPress={() => setNotificationsVisible(false)}
                accessible={true}
                accessibilityLabel="Close notifications"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color={Colors.textLight} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              ) : (
                notifications.map((notif) => (
                  <TouchableOpacity
                    key={notif._id}
                    style={styles.notificationItem}
                    onPress={() => {
                      setNotificationsVisible(false);
                      handleNotificationClick(notif);
                    }}
                    accessible={true}
                    accessibilityLabel={`${notif.title}, ${notif.message}`}
                    accessibilityRole="button"
                  >
                    <View style={[
                      styles.notifIcon,
                      { backgroundColor: `${getNotificationColor(notif.type)}20` }
                    ]}>
                      <Ionicons 
                        name={getNotificationIcon(notif.type)} 
                        size={20} 
                        color={getNotificationColor(notif.type)} 
                      />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notificationTitle}>{notif.title}</Text>
                      <Text style={styles.notificationDesc} numberOfLines={2}>{notif.message}</Text>
                      <Text style={styles.notificationTime}>
                        {formatNotificationTime(notif.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  banner: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerGradient: {
    padding: 30,
    minHeight: 100,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  actionCard: {
    width: '30%',
    margin: '1.66%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: 8,
  },
  announcementDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementType: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  announcementDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  drawerItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  notificationsPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  markAllRead: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
    gap: 12,
  },
  unreadNotification: {
    backgroundColor: '#F0F7FF',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: Colors.textLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
});