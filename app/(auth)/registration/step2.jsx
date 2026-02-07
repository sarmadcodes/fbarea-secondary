import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../../constants/Colors';
import authService from '../../../services/authService';
import { useCustomAlert } from '../../../components/CustomAlert';

export default function RegistrationStep2() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [formData, setFormData] = useState({
    cnicNumber: '',
    houseNumber: '',
    ownershipStatus: null,
  });
  const [profilePic, setProfilePic] = useState(null);
  const [cnicFront, setCnicFront] = useState(null);
  const [cnicBack, setCnicBack] = useState(null);
  
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Owner (Residential)', value: 'owner_residential' },
    { label: 'Tenant (Residential)', value: 'tenant_residential' },
    { label: 'Owner (Portion)', value: 'owner_portion' },
    { label: 'Tenant (Portion)', value: 'tenant_portion' },
    { label: 'Owner (Commercial)', value: 'owner_commercial' },
    { label: 'Tenant (Commercial)', value: 'tenant_commercial' },
  ]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // Format CNIC as user types: XXXXX-XXXXXXX-X
  const handleCnicChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + '-' + cleaned.slice(5);
    }
    if (cleaned.length > 12) {
      formatted = formatted.slice(0, 13) + '-' + cleaned.slice(12, 13);
    }
    
    setFormData({ ...formData, cnicNumber: formatted.slice(0, 15) });
  };

  const pickImage = async (type) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Camera roll permissions are needed', [], 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'profile') setProfilePic(result.assets[0].uri);
      else if (type === 'cnicFront') setCnicFront(result.assets[0].uri);
      else if (type === 'cnicBack') setCnicBack(result.assets[0].uri);
    }
  };

  const takePhoto = async (type) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission required', 'Camera permissions are needed', [], 'warning');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'profile') setProfilePic(result.assets[0].uri);
      else if (type === 'cnicFront') setCnicFront(result.assets[0].uri);
      else if (type === 'cnicBack') setCnicBack(result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    // Validate required fields
    if (!formData.cnicNumber) {
      showAlert('Validation Error', 'CNIC number is required', [], 'warning');
      return;
    }
    
    if (!formData.houseNumber) {
      showAlert('Validation Error', 'House number is required', [], 'warning');
      return;
    }
    
    if (!formData.ownershipStatus) {
      showAlert('Validation Error', 'Please select ownership status', [], 'warning');
      return;
    }

    // Check if all three images are uploaded
    if (!profilePic) {
      showAlert('Validation Error', 'Profile picture is required', [], 'warning');
      return;
    }

    if (!cnicFront) {
      showAlert('Validation Error', 'CNIC front image is required', [], 'warning');
      return;
    }

    if (!cnicBack) {
      showAlert('Validation Error', 'CNIC back image is required', [], 'warning');
      return;
    }

    setUploading(true);
    setUploadProgress('Preparing images...');

    try {
      await authService.saveStep2(
        {
          cnicNumber: formData.cnicNumber,
          houseNumber: formData.houseNumber,
          ownershipStatus: formData.ownershipStatus,
          profilePicUri: profilePic,
          cnicFrontUri: cnicFront,
          cnicBackUri: cnicBack,
        },
        (progress) => {
          console.log('[STEP2] Progress:', progress);
          setUploadProgress(progress);
        }
      );
      
      setUploadProgress('Upload complete!');
      
      // Small delay to show success
      setTimeout(() => {
        setUploading(false);
        router.push('/(auth)/registration/step3');
      }, 500);
      
    } catch (error) {
      console.error('[STEP2] Error:', error);
      setUploading(false);
      setUploadProgress('');
      
      showAlert(
        'Upload Failed',
        error.message || 'Failed to upload images. Please check your internet connection and try again.',
        [
          {
            text: 'Retry',
            onPress: handleNext,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />


      {/* Custom Alert */}
      <AlertComponent />
      {/* Upload Progress Modal */}
      <Modal visible={uploading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.modalText}>{uploadProgress}</Text>
            <Text style={styles.modalSubtext}>
              {uploadProgress.includes('Uploading') 
                ? 'This may take a moment...' 
                : 'Please wait...'}
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 2 of 4</Text>
          <Text style={styles.title}>Property & Documents</Text>
          <Text style={styles.subtitle}>Verify your residency and identity</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CNIC Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="12345-1234567-1"
                placeholderTextColor={Colors.textLight}
                value={formData.cnicNumber}
                onChangeText={handleCnicChange}
                keyboardType="numeric"
                maxLength={15}
                editable={!uploading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>House Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="home-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., A-123"
                placeholderTextColor={Colors.textLight}
                value={formData.houseNumber}
                onChangeText={(text) => setFormData({ ...formData, houseNumber: text })}
                editable={!uploading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ownership Status *</Text>
            <View style={{ zIndex: 1000 }}>
              <DropDownPicker
                open={open}
                value={formData.ownershipStatus}
                items={items}
                setOpen={setOpen}
                setValue={(callback) => {
                  const value = callback(formData.ownershipStatus);
                  setFormData({ ...formData, ownershipStatus: value });
                }}
                setItems={setItems}
                placeholder="Select ownership status"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                listMode="FLATLIST"
                flatListProps={{
                  scrollEnabled: false,
                }}
                disabled={uploading}
              />
            </View>
          </View>

          {/* Profile Picture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture * (Required)</Text>
            <View style={styles.imageCard}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color={Colors.textLight} />
                  <Text style={styles.placeholderText}>No image selected</Text>
                </View>
              )}
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage('profile')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="images-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => takePhoto('profile')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="camera-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* CNIC Front */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CNIC Front Side * (Required)</Text>
            <View style={styles.imageCard}>
              {cnicFront ? (
                <Image source={{ uri: cnicFront }} style={styles.cnicPreview} />
              ) : (
                <View style={styles.cnicPlaceholder}>
                  <Ionicons name="document-outline" size={40} color={Colors.textLight} />
                  <Text style={styles.placeholderText}>Front side of CNIC</Text>
                </View>
              )}
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage('cnicFront')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="images-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => takePhoto('cnicFront')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="camera-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* CNIC Back */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CNIC Back Side * (Required)</Text>
            <View style={styles.imageCard}>
              {cnicBack ? (
                <Image source={{ uri: cnicBack }} style={styles.cnicPreview} />
              ) : (
                <View style={styles.cnicPlaceholder}>
                  <Ionicons name="document-outline" size={40} color={Colors.textLight} />
                  <Text style={styles.placeholderText}>Back side of CNIC</Text>
                </View>
              )}
              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage('cnicBack')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="images-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => takePhoto('cnicBack')}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  <Ionicons name="camera-outline" size={18} color={Colors.white} />
                  <Text style={styles.imageButtonText}>Camera</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Images will be uploaded to secure cloud storage when you click Next. Clear photos help speed up the verification process.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, uploading && styles.nextButtonDisabled]} 
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Text style={styles.nextButtonText}>
            {uploading ? 'Uploading...' : 'Next'}
          </Text>
          {!uploading && <Ionicons name="arrow-forward" size={20} color={Colors.white} />}
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
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
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: 3,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  dropdown: {
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
  },
  dropdownContainer: {
    borderColor: Colors.border,
    borderRadius: 12,
    maxHeight: 400,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  imageCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginBottom: 16,
  },
  cnicPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  cnicPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    marginBottom: 16,
  },
  placeholderText: {
    color: Colors.textLight,
    fontSize: 13,
    marginTop: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    padding: 12,
    borderRadius: 10,
  },
  imageButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textLight,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
    backgroundColor: Colors.white,
  },
  backButtonText: {
    color: Colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});