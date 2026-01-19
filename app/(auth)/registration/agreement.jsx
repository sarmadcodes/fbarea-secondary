import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';

export default function Agreement() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleComplete = () => {
    if (agreed) {
      // Save registration data and navigate to login
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
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

          <Text style={styles.sectionTitle}>1. Accurate Information</Text>
          <Text style={styles.text}>
            You agree to provide accurate and complete information during registration. Any false
            or misleading information may result in suspension or termination of your account.
          </Text>

          <Text style={styles.sectionTitle}>2. Maintenance Fees</Text>
          <Text style={styles.text}>
            Monthly maintenance fees are due on the 1st of each month. Failure to pay maintenance
            fees may result in restricted access to certain services, including the digital
            resident card.
          </Text>

          <Text style={styles.sectionTitle}>3. Vehicle Registration</Text>
          <Text style={styles.text}>
            All vehicles must be registered with accurate information. Vehicle stickers must be
            displayed as per society regulations. Unregistered vehicles may not be permitted entry.
          </Text>

          <Text style={styles.sectionTitle}>4. Property Use</Text>
          <Text style={styles.text}>
            Residents agree to use the property in accordance with society rules and regulations.
            Any violations may result in penalties or legal action.
          </Text>

          <Text style={styles.sectionTitle}>5. Privacy</Text>
          <Text style={styles.text}>
            Your personal information will be kept confidential and used only for society
            management purposes. We will not share your information with third parties without your
            consent.
          </Text>

          <Text style={styles.sectionTitle}>6. Complaints & Grievances</Text>
          <Text style={styles.text}>
            The complaint system is provided for legitimate grievances. Misuse of the complaint
            system may result in account restrictions.
          </Text>

          <Text style={styles.sectionTitle}>7. Updates & Changes</Text>
          <Text style={styles.text}>
            The society reserves the right to update these terms at any time. Continued use of the
            application constitutes acceptance of updated terms.
          </Text>

          <Text style={styles.sectionTitle}>8. Account Security</Text>
          <Text style={styles.text}>
            You are responsible for maintaining the confidentiality of your account credentials.
            Notify the administration immediately if you suspect unauthorized access.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={20} color={Colors.white} />}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the terms and conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.completeButton, !agreed && styles.completeButtonDisabled]}
          onPress={handleComplete}
          disabled={!agreed}
        >
          <Text style={styles.completeButtonText}>Complete Registration</Text>
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
  header: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 6,
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
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: Colors.border,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});