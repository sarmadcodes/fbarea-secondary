import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '../../constants/Colors';
import userService from '../../services/userService';
import { useCustomAlert } from '../../components/CustomAlert';

export default function Security() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChangePassword = async () => {
    Keyboard.dismiss();

    // Validation with haptic feedback
    if (!currentPassword || !newPassword || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'Please fill all fields', [], 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'New password must be at least 6 characters', [], 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', 'New passwords do not match', [], 'error');
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await userService.changePassword(currentPassword, newPassword, confirmPassword);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', 'Password changed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTouched({ current: false, new: false, confirm: false });
          }
        }
      ], 'success');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert('Error', error.message || 'Failed to change password', [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch(field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
  };

  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const isValid = currentPassword && hasMinLength && passwordsMatch;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AlertComponent />

      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionDescription}>
            Ensure your account is using a strong password to stay secure
          </Text>
          
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <View style={[
              styles.inputWrapper,
              touched.current && !currentPassword && styles.inputError
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor={Colors.textLight}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                onBlur={() => setTouched({...touched, current: true})}
                secureTextEntry={!showCurrentPassword}
                editable={!loading}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('current')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
            {touched.current && !currentPassword && (
              <Text style={styles.errorText}>Current password is required</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={[
              styles.inputWrapper,
              touched.new && !hasMinLength && styles.inputError
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={Colors.textLight}
                value={newPassword}
                onChangeText={setNewPassword}
                onBlur={() => setTouched({...touched, new: true})}
                secureTextEntry={!showNewPassword}
                editable={!loading}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('new')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[
              styles.inputWrapper,
              touched.confirm && !passwordsMatch && confirmPassword.length > 0 && styles.inputError
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={Colors.textLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => setTouched({...touched, confirm: true})}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => togglePasswordVisibility('confirm')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textLight}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            
            <View style={styles.requirement}>
              <Ionicons
                name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={hasMinLength ? Colors.success : Colors.textLight}
              />
              <Text style={[
                styles.requirementText,
                hasMinLength && styles.requirementTextMet
              ]}>
                At least 6 characters
              </Text>
            </View>

            <View style={styles.requirement}>
              <Ionicons
                name={hasUpperCase ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={hasUpperCase ? Colors.success : Colors.textLight}
              />
              <Text style={[
                styles.requirementText,
                hasUpperCase && styles.requirementTextMet
              ]}>
                Contains uppercase letter
              </Text>
            </View>

            <View style={styles.requirement}>
              <Ionicons
                name={hasLowerCase ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={hasLowerCase ? Colors.success : Colors.textLight}
              />
              <Text style={[
                styles.requirementText,
                hasLowerCase && styles.requirementTextMet
              ]}>
                Contains lowercase letter
              </Text>
            </View>

            <View style={styles.requirement}>
              <Ionicons
                name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={hasNumber ? Colors.success : Colors.textLight}
              />
              <Text style={[
                styles.requirementText,
                hasNumber && styles.requirementTextMet
              ]}>
                Contains number
              </Text>
            </View>

            <View style={styles.requirement}>
              <Ionicons
                name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={passwordsMatch ? Colors.success : Colors.textLight}
              />
              <Text style={[
                styles.requirementText,
                passwordsMatch && styles.requirementTextMet
              ]}>
                Passwords match
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, (!isValid || loading) && styles.buttonDisabled]} 
            onPress={handleChangePassword}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.bottomPadding} />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    transition: 'all 0.2s ease',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: Colors.text,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  requirementsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  requirementTextMet: {
    color: Colors.success,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});