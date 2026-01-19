import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

export default function DrawerContent({ onClose, onItemPress, userName = "Muhammad Ahmed" }) {
  const menuItems = [
    { 
      id: 'home',
      icon: 'home-outline', 
      label: 'Dashboard', 
      route: '/(tabs)',
      color: '#2196F3',
      bgColor: '#E3F2FD',
    },
    { 
      id: 'card',
      icon: 'card-outline', 
      label: 'Digital Card', 
      route: '/screens/digitalCard',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
    },
    { 
      id: 'accounts',
      icon: 'wallet-outline', 
      label: 'Accounts', 
      route: '/screens/accounts',
      color: '#FF9800',
      bgColor: '#FFF3E0',
    },
    { 
      id: 'complaints',
      icon: 'warning-outline', 
      label: 'Complaints', 
      route: '/(tabs)/complaints',
      color: '#F44336',
      bgColor: '#FFEBEE',
    },
    { 
      id: 'documents',
      icon: 'document-text-outline', 
      label: 'Documents', 
      route: null,
      color: '#9C27B0',
      bgColor: '#F3E5F5',
    },
    { 
      id: 'community',
      icon: 'people-outline', 
      label: 'Community', 
      route: null,
      color: '#00BCD4',
      bgColor: '#E0F7FA',
    },
    { 
      id: 'profile',
      icon: 'person-outline', 
      label: 'Profile', 
      route: '/(tabs)/profile',
      color: '#607D8B',
      bgColor: '#ECEFF1',
    },
    { 
      id: 'settings',
      icon: 'settings-outline', 
      label: 'Settings', 
      route: null,
      color: '#795548',
      bgColor: '#EFEBE9',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[Colors.primary, Colors.secondary]} 
        style={styles.header}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.white} />
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userDetail}>Block 13, Federal B Area</Text>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => onItemPress(item)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.copyright}>© 2025 Block 13 FB Area</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  menuList: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  version: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: Colors.textLight,
  },
});