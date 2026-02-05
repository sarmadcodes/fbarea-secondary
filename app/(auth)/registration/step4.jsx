// ✅ UPDATED: app/(auth)/registration/step4.jsx
// Updated password validation to match backend (8 chars + complexity)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import { useCustomAlert } from '../../../components/CustomAlert';

export default function RegistrationStep4() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ UPDATED: Password validation function with new requirements
  const validatePassword = () => {
    const errors = [];
    
    // Check length (8 minimum)
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for common weak passwords
    const weakPasswords = ['Password123', 'Qwerty123', '12345678', 'Abc12345'];
    if (weakPasswords.includes(password)) {
      errors.push('Password is too common. Please choose a stronger password');
    }
    
    return errors;
  };

  const handleNext = async () => {
    // Validate password
    const passwordErrors = validatePassword();
    
    if (passwordErrors.length > 0) {
      showAlert(
        'Password Requirements',
        passwordErrors.join('\n\n'),
        [],
        'warning'
      );
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showAlert(
        'Validation Error',
        'Passwords do not match',
        [],
        'warning'
      );
      return;
    }

    try {
      await AsyncStorage.setItem('registrationPassword', password);
      router.push('/(auth)/registration/agreement');
    } catch (error) {
      showAlert('Error', 'Failed to save password', [], 'error');
    }
  };

  // ✅ UPDATED: Check all requirements
  const hasMinLength = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  
  const isValid = hasMinLength && hasLowercase && hasUppercase && hasNumber && passwordsMatch;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Custom Alert */}
      <AlertComponent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.stepText}>Step 4 of 4</Text>
            <Text style={styles.title}>Create Password</Text>
            <Text style={styles.subtitle}>
              Secure your account with a strong password
            </Text>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          <View style={styles.form}>
            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 &&
                password !== confirmPassword && (
                  <Text style={styles.errorText}>
                    Passwords do not match
                  </Text>
                )}
            </View>

            {/* ✅ UPDATED: Requirements with all 5 checks */}
            <View style={styles.requirementsCard}>
              <View style={styles.requirementsHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={Colors.secondary}
                />
                <Text style={styles.requirementsTitle}>
                  Password Requirements
                </Text>
              </View>

              <View style={styles.requirementsList}>
                {/* Minimum 8 characters */}
                <View style={styles.requirement}>
                  <Ionicons
                    name={
                      hasMinLength
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      hasMinLength
                        ? Colors.success
                        : Colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasMinLength && styles.requirementTextMet,
                    ]}
                  >
                    At least 8 characters
                  </Text>
                </View>

                {/* Lowercase letter */}
                <View style={styles.requirement}>
                  <Ionicons
                    name={
                      hasLowercase
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      hasLowercase
                        ? Colors.success
                        : Colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasLowercase && styles.requirementTextMet,
                    ]}
                  >
                    One lowercase letter (a-z)
                  </Text>
                </View>

                {/* Uppercase letter */}
                <View style={styles.requirement}>
                  <Ionicons
                    name={
                      hasUppercase
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      hasUppercase
                        ? Colors.success
                        : Colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasUppercase && styles.requirementTextMet,
                    ]}
                  >
                    One uppercase letter (A-Z)
                  </Text>
                </View>

                {/* Number */}
                <View style={styles.requirement}>
                  <Ionicons
                    name={
                      hasNumber
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      hasNumber
                        ? Colors.success
                        : Colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      hasNumber && styles.requirementTextMet,
                    ]}
                  >
                    One number (0-9)
                  </Text>
                </View>

                {/* Passwords match */}
                <View style={styles.requirement}>
                  <Ionicons
                    name={
                      passwordsMatch
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={20}
                    color={
                      passwordsMatch
                        ? Colors.success
                        : Colors.textLight
                    }
                  />
                  <Text
                    style={[
                      styles.requirementText,
                      passwordsMatch && styles.requirementTextMet,
                    ]}
                  >
                    Passwords match
                  </Text>
                </View>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={Colors.secondary}
              />
              <Text style={styles.infoText}>
                Choose a password you haven't used elsewhere to keep your
                account secure.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={Colors.secondary}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !isValid && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* =========================
   STYLES (unchanged)
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  stepText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },

  form: { padding: 20 },

  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: Colors.text,
  },
  eyeIcon: { padding: 8 },

  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
  },

  requirementsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementsHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  requirementsList: { gap: 12 },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  requirementTextMet: {
    color: Colors.success,
    fontWeight: '500',
  },

  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLight,
  },

  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});