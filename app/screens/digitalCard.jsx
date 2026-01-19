import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

export default function DigitalCard() {
  const router = useRouter();
  const [maintenancePaid, setMaintenancePaid] = useState(true); // Set to false to see blurred state

  const residentData = {
    name: 'Muhammad Ahmed',
    cnic: '42101-1234567-1',
    houseNumber: 'A-123',
    expiryDate: '31 Dec 2025',
    address: 'Block 13, Federal B Area, Karachi',
  };

  const handlePrint = () => {
    if (!maintenancePaid) {
      Alert.alert(
        'Payment Required',
        'Please pay your monthly maintenance to print the digital card.'
      );
      return;
    }
    Alert.alert('Print Card', 'Digital card will be sent to printer');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Card</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Card */}
        <View style={styles.cardContainer}>
          <View style={[styles.card, !maintenancePaid && styles.cardBlurred]}>
            <LinearGradient
              colors={['#4ade80', '#86efac', '#d1fae5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                {/* Logo Image */}
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <View style={styles.nameRow}>
                  <View style={styles.nameContainer}>
                    <Text style={styles.cardLabel}>Name</Text>
                    <Text style={styles.cardValue}>{residentData.name}</Text>
                  </View>
                  <View style={styles.profilePicContainer}>
                    <Image
                      source={{ uri: 'https://i.imgur.com/7k12EPD.png' }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>CNIC</Text>
                  <Text style={styles.cardValue}>{residentData.cnic}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>House No.</Text>
                  <Text style={styles.cardValue}>{residentData.houseNumber}</Text>
                </View>

                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Address</Text>
                  <Text style={styles.cardValue}>{residentData.address}</Text>
                </View>
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.expiryContainer}>
                  <Text style={styles.expiryLabel}>Valid Until</Text>
                  <Text style={styles.expiryDate}>{residentData.expiryDate}</Text>
                </View>
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={48} color="#22c55e" />
                </View>
              </View>
            </LinearGradient>

            {/* Blur Overlay */}
            {!maintenancePaid && (
              <View style={styles.blurOverlay}>
                <View style={styles.blurContent}>
                  <Ionicons name="lock-closed" size={48} color={Colors.white} />
                  <Text style={styles.blurTitle}>Payment Required</Text>
                  <Text style={styles.blurText}>
                    Please pay your monthly maintenance to access your digital card
                  </Text>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => router.push('/screens/accounts')}
                  >
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Card Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>
                This digital card serves as proof of residency
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>Cards are valid for one calendar year</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>Keep your card up to date with payments</Text>
            </View>
          </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardBlurred: {
    opacity: 0.6,
  },
  cardGradient: {
    padding: 24,
  },
  cardHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    gap: 4,
  },
  profilePicContainer: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#22c55e',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    gap: 12,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    color: '#374151',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(34, 197, 94, 0.3)',
  },
  expiryContainer: {
    gap: 4,
  },
  expiryLabel: {
    fontSize: 13,
    color: '#374151',
    opacity: 0.8,
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  qrPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  blurContent: {
    alignItems: 'center',
  },
  blurTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  blurText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  payButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    marginBottom: 24,
  },
  printButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  printButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});