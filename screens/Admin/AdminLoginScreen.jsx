// screens/Admin/AdminLoginScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import adminAuthService from '../../services/adminAuthService';
import { useCustomAlert } from '../../components/CustomAlert';

export default function AdminLoginScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  const [cnicNumber, setCnicNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔍 DEBUG: Log current route info
  React.useEffect(() => {
    console.log('📍 [ADMIN_LOGIN] Current pathname:', pathname);
    console.log('📍 [ADMIN_LOGIN] Current segments:', segments);
  }, [pathname, segments]);

  const formatCNIC = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format as XXXXX-XXXXXXX-X
    if (cleaned.length <= 5) {
      return cleaned;
    } else if (cleaned.length <= 12) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
  };

  const handleCNICChange = (text) => {
    const formatted = formatCNIC(text);
    setCnicNumber(formatted);
  };

  const validateForm = () => {
    if (!cnicNumber.trim()) {
      showAlert('Required', 'Please enter your CNIC number', [], 'error');
      return false;
    }

    // Remove dashes for validation
    const cleanedCNIC = cnicNumber.replace(/-/g, '');
    if (cleanedCNIC.length !== 13) {
      showAlert('Invalid CNIC', 'CNIC must be 13 digits', [], 'error');
      return false;
    }

    if (!password.trim()) {
      showAlert('Required', 'Please enter your password', [], 'error');
      return false;
    }

    if (password.length < 6) {
      showAlert('Invalid Password', 'Password must be at least 6 characters', [], 'error');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log('[ADMIN_LOGIN] 🔐 Attempting admin login...');
      const response = await adminAuthService.login(cnicNumber, password);

      if (response.success) {
        console.log('[ADMIN_LOGIN] ✅ Admin login successful');
        
        showAlert('Success', 'Welcome Admin!', [
          {
            text: 'Continue',
            onPress: () => {
              console.log('[ADMIN_LOGIN] 🧭 Attempting navigation...');
              console.log('[ADMIN_LOGIN] Current segments:', segments);
              
              // ✅ TRY MULTIPLE NAVIGATION APPROACHES
              try {
                // Approach 1: Direct relative path (should work if we're in (admin) group)
                console.log('[ADMIN_LOGIN] Trying: router.replace("payments")');
                router.replace('payments');
              } catch (err1) {
                console.error('[ADMIN_LOGIN] ❌ Approach 1 failed:', err1);
                
                try {
                  // Approach 2: With leading slash
                  console.log('[ADMIN_LOGIN] Trying: router.replace("/payments")');
                  router.replace('/payments');
                } catch (err2) {
                  console.error('[ADMIN_LOGIN] ❌ Approach 2 failed:', err2);
                  
                  try {
                    // Approach 3: Full path with group
                    console.log('[ADMIN_LOGIN] Trying: router.replace("/(admin)/payments")');
                    router.replace('/(admin)/payments');
                  } catch (err3) {
                    console.error('[ADMIN_LOGIN] ❌ Approach 3 failed:', err3);
                    
                    // Approach 4: Using push instead of replace
                    console.log('[ADMIN_LOGIN] Trying: router.push("payments")');
                    router.push('payments');
                  }
                }
              }
            },
          },
        ], 'success');
      }
    } catch (error) {
      console.error('[ADMIN_LOGIN] ❌ Login error:', error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Invalid credentials. Please try again.';
      
      showAlert('Login Failed', errorMessage, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <AlertComponent />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="shield-checkmark" size={60} color={Colors.white} />
              </View>
              <Text style={styles.title}>Admin Panel</Text>
              <Text style={styles.subtitle}>FB Area Block 13</Text>
              {/* 🔍 DEBUG INFO */}
              <Text style={styles.debugText}>Route: {pathname}</Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {/* CNIC Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="card-outline" size={24} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="CNIC Number (42201-1111111-1)"
                  value={cnicNumber}
                  onChangeText={handleCNICChange}
                  keyboardType="numeric"
                  maxLength={15} // Including dashes
                  editable={!loading}
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={24} color={Colors.textLight} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  placeholderTextColor={Colors.textLight}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={24}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Login to Admin Panel</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.primary} />
                <Text style={styles.backButtonText}>Back to App</Text>
              </TouchableOpacity>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.white} />
              <Text style={styles.securityText}>Authorized Admin Access Only</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  debugText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.5,
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8F4',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#1B5E20',
  },
  eyeIcon: {
    paddingRight: 16,
    paddingLeft: 12,
  },
  loginButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 12,
    gap: 8,
  },
  backButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    gap: 8,
  },
  securityText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
});