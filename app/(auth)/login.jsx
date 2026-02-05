// app/(auth)/login.jsx - PRODUCTION READY: Using AdminAuthContext
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
  StatusBar,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useCustomAlert } from '../../components/CustomAlert';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { loginAdmin } = useAdminAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  // Main state
  const [isLogin, setIsLogin] = useState(true);
  const [cnic, setCnic] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin mode state
  const [adminModalVisible, setAdminModalVisible] = useState(false);

  const handleCnicChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
    }
    if (cleaned.length > 12) {
      formatted = formatted.slice(0, 13) + '-' + cleaned.slice(12, 13);
    }
    
    setCnic(formatted.slice(0, 15));
  };

  // Admin Login Handler
  const handleAdminLogin = async () => {
    if (!cnic.trim()) {
      showAlert('Required', 'Please enter admin CNIC number', [], 'warning');
      return;
    }

    if (cnic.replace(/-/g, '').length !== 13) {
      showAlert('Invalid CNIC', 'Please enter a valid 13-digit CNIC number', [], 'warning');
      return;
    }

    if (!password.trim()) {
      showAlert('Required', 'Please enter admin password', [], 'warning');
      return;
    }

    setLoading(true);

    try {
      console.log('[LOGIN_SCREEN] 🔐 Attempting admin login...');
      
      const result = await loginAdmin(cnic, password);

      if (result.success) {
        console.log('[LOGIN_SCREEN] ✅ Admin login successful');
        
        // Close modal immediately
        setAdminModalVisible(false);
        
        // Clear form
        setCnic('');
        setPassword('');
        setShowPassword(false);
        
        // Show success message
        showAlert('Success', 'Welcome Admin!', [], 'success');
        
        // Navigation will be handled by NavigationGuard automatically
      } else {
        showAlert('Admin Login Failed', result.error || 'Invalid credentials', [], 'error');
      }
    } catch (error) {
      console.error('[LOGIN_SCREEN] ❌ Admin login failed:', error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Invalid admin credentials. Please try again.';
      
      showAlert('Admin Login Failed', errorMessage, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  // User Login Handler
  const handleLogin = async () => {
    if (!cnic.trim()) {
      showAlert('Validation Error', 'Please enter your CNIC number', [], 'warning');
      return;
    }

    if (cnic.replace(/-/g, '').length !== 13) {
      showAlert('Validation Error', 'Please enter a valid 13-digit CNIC number', [], 'warning');
      return;
    }

    if (!password.trim()) {
      showAlert('Validation Error', 'Please enter your password', [], 'warning');
      return;
    }

    if (password.length < 6) {
      showAlert('Validation Error', 'Password must be at least 6 characters', [], 'warning');
      return;
    }

    setLoading(true);

    try {
      console.log('[LOGIN_SCREEN] 🔐 Attempting user login...');
      
      const result = await login(cnic, password);

      if (result.success) {
        console.log('[LOGIN_SCREEN]  User login successful');
        // Navigation handled by NavigationGuard
      } else {
        console.error('[LOGIN_SCREEN]  User login failed:', result.error);
        
        let errorTitle = 'Login Failed';
        let errorMessage = result.error || 'Please try again.';
        let alertType = 'error';
        
        if (result.error?.includes('pending') || result.error?.includes('approval')) {
          errorTitle = ' Account Pending';
          errorMessage = 'Your account is awaiting admin approval.\n\nThis usually takes 24-48 hours. You\'ll receive a notification when approved.';
          alertType = 'info';
        } else if (result.error?.includes('rejected')) {
          errorTitle = 'Account Rejected';
          errorMessage = 'Your registration has been rejected.\n\nPlease contact administration for details.';
          alertType = 'error';
        } else if (result.error?.includes('suspended')) {
          errorTitle = 'Account Suspended';
          errorMessage = 'Your account has been suspended.\n\nContact administration for assistance.';
          alertType = 'error';
        } else if (result.error?.includes('Invalid') || result.error?.includes('credentials') || result.error?.includes('incorrect')) {
          errorTitle = 'Invalid Credentials';
          errorMessage = 'CNIC number or password is incorrect.\n\nPlease check and try again.';
          alertType = 'warning';
        } else if (result.error?.includes('Network') || result.error?.includes('timeout') || result.error?.includes('connection')) {
          errorTitle = 'Connection Error';
          errorMessage = 'Cannot connect to server.\n\nCheck your internet and try again.';
          alertType = 'error';
        }
        
        showAlert(errorTitle, errorMessage, [], alertType);
      }
    } catch (error) {
      console.error('[LOGIN_SCREEN]  Unexpected error:', error);
      showAlert(
        'Error',
        'An unexpected error occurred.\n\nPlease try again or contact support.',
        [],
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/(auth)/registration/step1');
  };

  const openAdminModal = () => {
    setCnic('');
    setPassword('');
    setShowPassword(false);
    setAdminModalVisible(true);
  };

  const closeAdminModal = () => {
    setAdminModalVisible(false);
    setCnic('');
    setPassword('');
    setShowPassword(false);
  };

  return (
    <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <AlertComponent />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Block 13 Federal B Area</Text>
            <Text style={styles.subtitle}>Resident Portal</Text>
            
            <TouchableOpacity 
              style={styles.adminAccessButton}
              onPress={openAdminModal}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={16} color={Colors.white} />
              <Text style={styles.adminAccessText}>Admin Access</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => setIsLogin(true)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => setIsLogin(false)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {isLogin ? (
              <View style={styles.form}>
                <Text style={styles.label}>CNIC Number</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="12345-1234567-1"
                    placeholderTextColor={Colors.textLight}
                    value={cnic}
                    onChangeText={handleCnicChange}
                    keyboardType="numeric"
                    maxLength={15}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={Colors.textLight}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#1976D2" />
                  <Text style={styles.infoText}>
                    First time user? Switch to Register tab to create your account.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.registerInfo}>
                <Ionicons name="person-add" size={60} color={Colors.primary} />
                <Text style={styles.registerTitle}>New Resident Registration</Text>
                <Text style={styles.registerText}>
                  Register as a new resident to access community services, submit payments, and stay updated with announcements.
                </Text>
                
                <View style={styles.stepsPreview}>
                  <View style={styles.stepItem}>
                    <Ionicons name="person-outline" size={20} color={Colors.primary} />
                    <Text style={styles.stepText}>Personal Information</Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="home-outline" size={20} color={Colors.primary} />
                    <Text style={styles.stepText}>Property Details</Text>
                  </View>
                  <View style={styles.stepItem}>
                    <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
                    <Text style={styles.stepText}>Document Verification</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRegister}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Start Registration</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Admin Login Modal */}
      <Modal
        visible={adminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAdminModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                
                <Text style={styles.modalTitle}>Admin Login</Text>
              </View>
              <TouchableOpacity onPress={closeAdminModal} disabled={loading}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalLabel}>Admin CNIC Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="42201-1111111-1"
                  placeholderTextColor={Colors.textLight}
                  value={cnic}
                  onChangeText={handleCnicChange}
                  keyboardType="numeric"
                  maxLength={15}
                  editable={!loading}
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modalLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter admin password"
                  placeholderTextColor={Colors.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={Colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.adminWarningBox}>
                <Ionicons name="warning" size={20} color="#92400E" />
                <Text style={styles.adminWarningText}>
                  This is for authorized administrators only. Unauthorized access attempts will be logged.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeAdminModal}
                disabled={loading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalLoginButton, loading && styles.buttonDisabled]}
                onPress={handleAdminLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.modalLoginText}>Login</Text>
                    
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 125, paddingBottom: 30 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#FFFFFF', marginTop: 8, opacity: 0.9 },
  adminAccessButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', gap: 6 },
  adminAccessText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  formContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  tabContainer: { flexDirection: 'row', marginBottom: 30, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 16, color: '#757575', fontWeight: '600' },
  activeTabText: { color: '#2E7D32' },
  form: { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, padding: 15, fontSize: 16, color: '#333' },
  eyeIcon: { padding: 8 },
  button: { backgroundColor: '#388E3C', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%' },
  buttonDisabled: { backgroundColor: '#DDD', opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 10, gap: 10, marginTop: 10 },
  infoText: { flex: 1, fontSize: 12, color: '#333', lineHeight: 18 },
  registerInfo: { alignItems: 'center', paddingVertical: 20 },
  registerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  registerText: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  stepsPreview: { width: '100%', gap: 12, marginBottom: 20 },
  stepItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, gap: 12 },
  stepText: { fontSize: 14, color: '#333', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#DDD' },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalBody: { padding: 20, maxHeight: 400 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 8 },
  adminWarningBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, gap: 10, marginTop: 16, borderWidth: 1, borderColor: '#FCD34D' },
  adminWarningText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#DDD', gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalCancelButton: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: '#333' },
  modalLoginButton: { backgroundColor: '#2E7D32', flexDirection: 'row', gap: 8 },
  modalLoginText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});