import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import apiClient from '../../services/apiClient';
import { useCustomAlert } from '../../components/CustomAlert';

export default function DigitalCard() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [cardStatus, setCardStatus] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchCardData();
  }, []);

  const fetchCardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/digital-cards/my-card');
      
      if (response.success) {
        setCardData(response.data);
        setCardStatus(response.data.status);
        setRequiresPayment(false);
      }
    } catch (error) {
      console.error('Card fetch error:', error);
      
      // Check if payment is required
      if (error.response?.data?.requiresPayment) {
        setRequiresPayment(true);
        setCardData(null);
      } else if (error.response?.status === 403) {
        setRequiresPayment(true);
        setCardData(null);
      } else {
        showAlert('Error', error.message || 'Failed to load digital card');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      router.push('/(tabs)');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handlePrint = async () => {
    if (!cardData || cardData.status !== 'approved') {
      showAlert(
        'Cannot Print',
        'Your digital card must be approved before printing.'
      );
      return;
    }

    try {
      // Record print
      await apiClient.post('/digital-cards/record-print');
      
      showAlert('Print Card', 'Digital card will be sent to printer', [{ text: 'OK' }], 'error');
    } catch (error) {
      console.error('Print error:', error);
      showAlert('Error', 'Failed to record print', [], 'error');
    }
  };

  const getExpiryDate = () => {
    if (cardData?.expiryDate) {
      const date = new Date(cardData.expiryDate);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading digital card...</Text>
      </View>
    );
  }

  // Show payment required message
  if (requiresPayment) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        

      {/* Custom Alert */}
      <AlertComponent />
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Card</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.paymentRequiredContainer}>
          <Ionicons name="card-outline" size={80} color={Colors.textLight} />
          <Text style={styles.paymentRequiredTitle}>Payment Required</Text>
          <Text style={styles.paymentRequiredText}>
            Please pay your monthly maintenance to access your digital card.
          </Text>
          <TouchableOpacity
            style={styles.payNowButton}
            onPress={() => router.push('/screens/accounts')}
          >
            <Text style={styles.payNowButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show pending approval message
  if (cardData && cardData.status === 'pending') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        

      {/* Custom Alert */}
      <AlertComponent />
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Card</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.pendingContainer}>
          <Ionicons name="time-outline" size={80} color={Colors.secondary} />
          <Text style={styles.pendingTitle}>Approval Pending</Text>
          <Text style={styles.pendingText}>
            Your digital card is pending approval. Please contact administration for more information.
          </Text>
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.infoBoxText}>
              Your card will be activated once the administrator approves it.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show rejected message
  if (cardData && cardData.status === 'rejected') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        

      {/* Custom Alert */}
      <AlertComponent />
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Card</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.rejectedContainer}>
          <Ionicons name="close-circle-outline" size={80} color={Colors.error} />
          <Text style={styles.rejectedTitle}>Card Rejected</Text>
          <Text style={styles.rejectedText}>
            Your digital card application has been rejected.
          </Text>
          {cardData.rejectionReason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{cardData.rejectionReason}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(tabs)/complaints')}
          >
            <Text style={styles.contactButtonText}>Contact Administration</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show suspended message
  if (cardData && cardData.status === 'suspended') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        

      {/* Custom Alert */}
      <AlertComponent />
        <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Card</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        <View style={styles.suspendedContainer}>
          <Ionicons name="ban-outline" size={80} color={Colors.error} />
          <Text style={styles.suspendedTitle}>Card Suspended</Text>
          <Text style={styles.suspendedText}>
            Your digital card has been suspended.
          </Text>
          {cardData.suspensionReason && (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <Text style={styles.reasonText}>{cardData.suspensionReason}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(tabs)/complaints')}
          >
            <Text style={styles.contactButtonText}>Contact Administration</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show approved card
  if (!cardData || !cardData.user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load card data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCardData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      

      {/* Custom Alert */}
      <AlertComponent />
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Card</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <LinearGradient
              colors={['#6BB55C', '#4A8F3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Subtle Pattern Overlay */}
              <View style={styles.patternOverlay}>
                <View style={styles.circlePattern1} />
                <View style={styles.circlePattern2} />
                <View style={styles.gridLine1} />
                <View style={styles.gridLine2} />
              </View>

              <View style={styles.cardInner}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                  <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.cardType}>RESIDENT CARD</Text>
                </View>

                <View style={styles.divider} />

                {/* Main Content */}
                <View style={styles.mainContent}>
                  <View style={styles.infoColumn}>
                    <View style={styles.field}>
                      <Text style={styles.label}>FULL NAME</Text>
                      <Text style={styles.value}>{cardData.user.fullName}</Text>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>CNIC NUMBER</Text>
                      <Text style={styles.value}>{cardData.user.cnicNumber}</Text>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>HOUSE NO</Text>
                      <Text style={styles.value}>{cardData.user.houseNumber}</Text>
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>ADDRESS</Text>
                      <Text style={styles.value}>Block 13, Federal B Area, Karachi</Text>
                    </View>
                  </View>

                  <View style={styles.photoContainer}>
                    <View style={styles.photoBorder}>
                      {cardData.user.profilePicture?.url ? (
                        <Image
                          source={{ uri: cardData.user.profilePicture.url }}
                          style={styles.profilePhoto}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="person" size={60} color="rgba(255,255,255,0.3)" />
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Footer Section */}
                <View style={styles.footerSection}>
                  <View style={styles.validityInfo}>
                    <Ionicons name="shield-checkmark" size={18} color="rgba(255,255,255,0.9)" />
                    <View>
                      <Text style={styles.footerLabel}>VALID UNTIL</Text>
                      <Text style={styles.footerValue}>{getExpiryDate()}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.qrBox}>
                    <View style={styles.qrBorder}>
                      <Ionicons name="qr-code" size={60} color="rgba(255,255,255,0.95)" />
                    </View>
                  </View>
                </View>

                {/* Card Number */}
                <View style={styles.cardNumberSection}>
                  <Text style={styles.cardNumberLabel}>CARD NO.</Text>
                  <Text style={styles.cardNumberValue}>{cardData.cardNumber}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle}>Card Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>
                This digital card serves as proof of residency
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.secondary} />
              <Text style={styles.infoText}>Keep your card active with regular payments</Text>
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
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Payment Required
  paymentRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  paymentRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  paymentRequiredText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  payNowButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  payNowButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Pending/Rejected/Suspended
  pendingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  pendingText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  
  rejectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  rejectedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: 20,
    marginBottom: 12,
  },
  rejectedText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  reasonBox: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  suspendedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  suspendedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: 20,
    marginBottom: 12,
  },
  suspendedText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Card Display
  cardContainer: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 15,
    position: 'relative',
  },
  
  cardGradient: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  circlePattern1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    top: -40,
    right: -40,
  },
  circlePattern2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.015)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -30,
  },
  gridLine1: {
    position: 'absolute',
    left: '20%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLine2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '30%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  
  cardInner: {
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
  
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: '100%',
    height: 80,
    marginBottom: 6,
  },
  cardType: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
    letterSpacing: 4,
  },
  
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 18,
  },
  
  mainContent: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  
  infoColumn: {
    flex: 1,
    gap: 14,
  },
  
  field: {
    gap: 4,
  },
  
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  
  value: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  
  photoContainer: {
    padding: 3,
  },
  
  photoBorder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderRightColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  
  profilePhoto: {
    width: '100%',
    height: '100%',
  },
  
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  validityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  footerLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: 2,
  },
  
  footerValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  qrBox: {
    padding: 2,
  },
  
  qrBorder: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderRightColor: 'rgba(255,255,255,0.1)',
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderLeftColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cardNumberSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  
  cardNumberLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  
  cardNumberValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  infoBlock: {
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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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