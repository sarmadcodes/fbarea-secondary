import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useCustomAlert } from '../../components/CustomAlert';

export default function Profile() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { user: authUser, logout, isLoggingOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // ✅ Don't fetch if logging out
    if (!isLoggingOut && authUser) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [authUser, isLoggingOut]);

  const fetchUserData = async () => {
    // ✅ Double check we're not logging out
    if (isLoggingOut) {
      console.log('[PROFILE] Skipping fetch - logout in progress');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.getProfile();
      if (response.data?.user) {
        setUserData(response.data.user);
      }
    } catch (error) {
      // ✅ Don't show error if we're logging out or not authenticated
      if (!isLoggingOut && error.response?.status !== 401) {
        console.error('Error fetching user data:', error);
        showAlert('Error', 'Failed to load profile data', [], 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            // ✅ Call logout from context (handles everything)
            await logout();
            // Navigation will be handled by NavigationGuard in _layout
          } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even on error
            router.replace('/(auth)/login');
          }
        },
      },
    ], 'warning');
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Personal Information',
      route: '/screens/personalInfo',
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Security',
      route: '/screens/security',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      route: '/screens/terms',
      color: '#FF9800',
      bgColor: '#FFF3E0',
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      route: '/screens/helpSupport',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
    },
  ];

  // ✅ Show loading while logging out
  if (isLoggingOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Logging out...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // ✅ Use userData if available, fallback to authUser
  const displayUser = userData || authUser;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      

      {/* Custom Alert */}
      <AlertComponent />
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.homeButton}>
          <Ionicons name="home-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.profileSection}>
            <View style={styles.profilePic}>
              {displayUser?.profilePicture?.url ? (
                <Image
                  source={{ uri: displayUser.profilePicture.url }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={48} color={Colors.white} />
              )}
            </View>
            <Text style={styles.profileName}>
              {displayUser?.fullName || 'User'}
            </Text>
            <Text style={styles.profileDetail}>
              Block 13, House {displayUser?.houseNumber || 'N/A'}
            </Text>
            <Text style={styles.profileDetail}>
              {displayUser?.cnicNumber || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => router.push(item.route)}
              disabled={isLoggingOut}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={24} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.version}>
          
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  homeButton: {
    padding: 8,
    marginTop: 8,
  },
  headerCenter: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.white,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  profileDetail: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuList: {
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  version: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});