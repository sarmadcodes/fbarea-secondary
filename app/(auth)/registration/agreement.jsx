// app/(auth)/registration/agreement.jsx - WITH CUSTOM ALERTS
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import authService from '../../../services/authService';
import { useCustomAlert } from '../../../components/CustomAlert';

export default function Agreement() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const { showAlert, AlertComponent } = useCustomAlert();

  const handleComplete = async () => {
    if (!agreed) {
      showAlert(
        'Agreement Required',
        'Please accept the terms and conditions to continue',
        [],
        'warning'
      );
      return;
    }

    setLoading(true);
    setProgress('Preparing registration...');

    try {
      // Get password from AsyncStorage
      const password = await AsyncStorage.getItem('registrationPassword');
      if (!password) {
        throw new Error('Password not found. Please restart registration.');
      }

      // Save password to service
      authService.registrationData.password = password;

      // Complete registration with progress updates
      const response = await authService.completeRegistration((progressText) => {
        console.log('[AGREEMENT] Progress:', progressText);
        setProgress(progressText);
      });
      
      setProgress('Success!');
      console.log('[AGREEMENT] ✅ Registration response:', response);

      // Wait a moment to show success
      setTimeout(() => {
        setLoading(false);
        
        showAlert(
          'Registration Submitted!',
          'Your registration has been submitted successfully.\n\nAn admin will review your application within 24-48 hours. You will be able to login once approved.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/(auth)/login');
              },
            },
          ],
          'success'
        );
      }, 1000);

    } catch (error) {
      console.error('[AGREEMENT] ❌ Registration error:', error);
      setLoading(false);
      setProgress('');
      
      // Show detailed error
      showAlert(
        'Registration Failed',
        error.message || 'An error occurred during registration. Please try again.',
        [
          {
            text: 'Retry',
            onPress: handleComplete,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        'error'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Alert */}
      <AlertComponent />

      {/* Progress Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.modalText}>{progress}</Text>
            <Text style={styles.modalSubtext}>
              {progress.includes('Converting') 
                ? 'This may take a moment...' 
                : progress.includes('Submitting')
                ? 'Almost done...'
                : 'Please wait...'}
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Terms & Agreement</Text>
        <Text style={styles.subtitle}>Please read and accept the terms to continue</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Resident Agreement</Text>
          <Text style={styles.text}>
            Welcome to Block 13 Federal B Area Resident Portal. By registering and using this
            application, you agree to the following terms and conditions:
          </Text>

          <View style={styles.highlightBox}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.secondary} />
            <Text style={styles.highlightText}>
              I agree to become part of 'Community Security & Governance Initiative' initiated by{' '}
              <Text style={styles.boldText}>Block 13 Federal B Area Residents Welfare Association</Text>
              {' '}and pay Monthly Charges to make our Block-13 secure, safe, vibrant, and well governed community.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>1. Accurate Information</Text>
          <Text style={styles.text}>
            You agree to provide accurate and complete information during registration. Any false
            or misleading information may result in suspension or termination of your account.
          </Text>

          <Text style={styles.sectionTitle}>2. Admin Approval</Text>
          <Text style={styles.text}>
            All new registrations require admin approval. You will not be able to access the portal
            until your account has been verified and approved by an administrator.
          </Text>

          <Text style={styles.sectionTitle}>3. Maintenance Fees</Text>
          <Text style={styles.text}>
            Monthly maintenance fees are due on the 1st of each month. Failure to pay maintenance
            fees may result in restricted access to certain services.
          </Text>

          <Text style={styles.sectionTitle}>4. Vehicle Registration</Text>
          <Text style={styles.text}>
            All vehicles must be registered with accurate information. Vehicle stickers must be
            displayed as per society regulations.
          </Text>

          <Text style={styles.sectionTitle}>5. Privacy</Text>
          <Text style={styles.text}>
            Your personal information will be kept confidential and used only for society
            management purposes.
          </Text>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="cloud-upload-outline" size={24} color={Colors.secondary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>What happens next?</Text>
              <Text style={styles.infoText}>
                • Your data will be submitted{'\n'}
                • Admin will review within 24-48 hours{'\n'}
                • You'll be notified when approved{'\n'}
                • Then you can login and use the app
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
          disabled={loading}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={20} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the terms and conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, (!agreed || loading) && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={!agreed || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.completeButtonText}>
            {loading ? 'Processing...' : 'Complete Registration'}
          </Text>
          {!loading && <Ionicons name="checkmark-circle" size={20} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 320,
  },
  modalText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  modalSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  header: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginTop: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    marginTop: 20,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});