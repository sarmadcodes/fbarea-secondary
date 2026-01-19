import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

export default function Terms() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Resident Agreement</Text>
        <Text style={styles.text}>
          Welcome to Block 13 Federal B Area Resident Portal. By using this application, you agree to the following terms and conditions.
        </Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
        </Text>

        <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
        <Text style={styles.text}>
          You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device.
        </Text>

        <Text style={styles.sectionTitle}>3. Privacy Policy</Text>
        <Text style={styles.text}>
          Your privacy is important to us. All personal information will be kept confidential and used only for society management purposes.
        </Text>

        <Text style={styles.sectionTitle}>4. Payment Terms</Text>
        <Text style={styles.text}>
          Monthly maintenance fees are due on the 1st of each month. Late payments may result in restricted access to services.
        </Text>

        <Text style={styles.sectionTitle}>5. Modifications</Text>
        <Text style={styles.text}>
          We reserve the right to modify these terms at any time. Continued use of the application constitutes acceptance of modified terms.
        </Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
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
});