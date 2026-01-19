import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Colors from '../../constants/Colors';

export default function Dashboard() {
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const menuItems: Array<{ icon: any; label: string; route: string | null }> = [
    { icon: 'card-outline', label: 'Digital Card', route: '/screens/digitalCard' as const },
    { icon: 'wallet-outline', label: 'Accounts', route: '/screens/accounts' as const },
    { icon: 'warning-outline', label: 'Complaints', route: '/(tabs)/complaints' as const },
    { icon: 'document-text-outline', label: 'Documents', route: null },
    { icon: 'people-outline', label: 'Community', route: null },
    { icon: 'settings-outline', label: 'Settings', route: null },
  ];

  const announcements = [
    {
      id: 1,
      title: 'Maintenance Schedule',
      description: 'Water supply maintenance on Sunday from 10 AM to 2 PM',
      date: '2 days ago',
    },
    {
      id: 2,
      title: 'Security Alert',
      description: 'Please ensure main gates are locked after 11 PM',
      date: '5 days ago',
    },
    {
      id: 3,
      title: 'Community Event',
      description: 'Annual general meeting scheduled for next month',
      date: '1 week ago',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)}>
            <Ionicons name="menu" size={28} color={Colors.white} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Block 13 FB</Text>
          </View>
          
          <TouchableOpacity onPress={() => setNotificationsVisible(true)}>
            <View>
              <Ionicons name="notifications-outline" size={28} color={Colors.white} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Banner */}
        <View style={styles.banner}>
          <LinearGradient
            colors={['#4CAF50', '#A5D6A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <Text style={styles.bannerTitle}>Welcome Back!</Text>
            <Text style={styles.bannerSubtitle}>Your community at your fingertips</Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/screens/digitalCard')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="card-outline" size={28} color="#2196F3" />
              </View>
              <Text style={styles.actionLabel}>Digital Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/screens/accounts')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="wallet-outline" size={28} color="#4CAF50" />
              </View>
              <Text style={styles.actionLabel}>Accounts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/complaints')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="warning-outline" size={28} color="#FF9800" />
              </View>
              <Text style={styles.actionLabel}>Complaints</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Announcements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.map((announcement) => (
            <View key={announcement.id} style={styles.announcementCard}>
              <View style={styles.announcementIcon}>
                <Ionicons name="megaphone-outline" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.announcementContent}>
                <Text style={styles.announcementTitle}>{announcement.title}</Text>
                <Text style={styles.announcementDescription}>
                  {announcement.description}
                </Text>
                <Text style={styles.announcementDate}>{announcement.date}</Text>
              </View>
            </View>
          ))}
        </View>
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
          <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setDrawerVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.drawerItem}
                onPress={() => {
                  setDrawerVisible(false);
                  if (item.route) router.push(item.route as any);
                }}
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
          <View style={styles.notificationsPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {announcements.map((notif) => (
                <View key={notif.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{notif.title}</Text>
                  <Text style={styles.notificationDesc}>{notif.description}</Text>
                  <Text style={styles.notificationTime}>{notif.date}</Text>
                </View>
              ))}
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
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  announcementDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
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
  notificationItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
});