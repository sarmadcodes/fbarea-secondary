import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../../constants/Colors';
import authService from '../../../services/authService';
import { useCustomAlert } from '../../../components/CustomAlert';

// Vehicle Input Card Component
const VehicleInputCard = ({ vehicle, index, type, onUpdate, onRemove, canRemove, onImagePick }) => {
  const icon = type === 'car' ? 'car-outline' : 'bicycle-outline';
  const label = type === 'car' ? 'Car' : 'Bike';

  return (
    <View style={styles.vehicleCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.vehicleIconSmall}>
            <Ionicons name={icon} size={20} color={Colors.secondary} />
          </View>
          <Text style={styles.cardTitle}>
            {label} {index + 1}
          </Text>
        </View>
        {canRemove && (
          <TouchableOpacity 
            onPress={onRemove}
            style={styles.deleteButton}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Plate Number *</Text>
        <TextInput
          style={styles.input}
          placeholder={`e.g., ${type === 'car' ? 'ABC-123' : 'KHI-789'}`}
          placeholderTextColor={Colors.textLight}
          value={vehicle.plateNumber}
          onChangeText={(text) => onUpdate(vehicle.id, 'plateNumber', text.toUpperCase())}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Make *</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'car' ? 'Toyota' : 'Honda'}
            placeholderTextColor={Colors.textLight}
            value={vehicle.make}
            onChangeText={(text) => onUpdate(vehicle.id, 'make', text)}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Model *</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'car' ? 'Corolla' : 'CD 70'}
            placeholderTextColor={Colors.textLight}
            value={vehicle.model}
            onChangeText={(text) => onUpdate(vehicle.id, 'model', text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Color *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., White, Black, Red"
          placeholderTextColor={Colors.textLight}
          value={vehicle.color}
          onChangeText={(text) => onUpdate(vehicle.id, 'color', text)}
        />
      </View>

      {/* Image Upload Section */}
      <View style={styles.imageSection}>
        <Text style={styles.imageSectionTitle}>Upload Documents (Required if filling details)</Text>
        
        <View style={styles.imagesRow}>
          <View style={styles.uploadContainerSmall}>
            <Text style={styles.uploadLabelSmall}>Registration *</Text>
            <TouchableOpacity 
              style={styles.uploadButtonSmall}
              onPress={() => onImagePick(vehicle.id, type, 'registration')}
              activeOpacity={0.7}
            >
              {vehicle.registrationImageUri ? (
                <View style={styles.imagePreviewSmall}>
                  <Image source={{ uri: vehicle.registrationImageUri }} style={styles.previewImageSmall} />
                  <View style={styles.imageOverlaySmall}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholderSmall}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.textLight} />
                  <Text style={styles.uploadTextSmall}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.uploadContainerSmall}>
            <Text style={styles.uploadLabelSmall}>Vehicle Photo *</Text>
            <TouchableOpacity 
              style={styles.uploadButtonSmall}
              onPress={() => onImagePick(vehicle.id, type, 'vehicle')}
              activeOpacity={0.7}
            >
              {vehicle.vehicleImageUri ? (
                <View style={styles.imagePreviewSmall}>
                  <Image source={{ uri: vehicle.vehicleImageUri }} style={styles.previewImageSmall} />
                  <View style={styles.imageOverlaySmall}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPlaceholderSmall}>
                  <Ionicons name="camera-outline" size={24} color={Colors.textLight} />
                  <Text style={styles.uploadTextSmall}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function RegistrationStep3() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const vehicleIdCounter = useRef(1);
  
  const [cars, setCars] = useState([
    { id: 0, plateNumber: '', make: '', model: '', color: '', registrationImageUri: null, vehicleImageUri: null },
  ]);
  const [bikes, setBikes] = useState([
    { id: 0, plateNumber: '', make: '', model: '', color: '', registrationImageUri: null, vehicleImageUri: null },
  ]);

  // ✅ NEW: Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const addCar = useCallback(() => {
    setCars(prev => [...prev, { 
      id: vehicleIdCounter.current++, 
      plateNumber: '', 
      make: '', 
      model: '', 
      color: '', 
      registrationImageUri: null, 
      vehicleImageUri: null,
    }]);
  }, []);

  const removeCar = useCallback((id) => {
    setCars(prev => prev.length > 1 ? prev.filter((car) => car.id !== id) : prev);
  }, []);

  const updateCar = useCallback((id, field, value) => {
    setCars(prev => prev.map((car) => (car.id === id ? { ...car, [field]: value } : car)));
  }, []);

  const addBike = useCallback(() => {
    setBikes(prev => [...prev, { 
      id: vehicleIdCounter.current++, 
      plateNumber: '', 
      make: '', 
      model: '', 
      color: '', 
      registrationImageUri: null, 
      vehicleImageUri: null,
    }]);
  }, []);

  const removeBike = useCallback((id) => {
    setBikes(prev => prev.length > 1 ? prev.filter((bike) => bike.id !== id) : prev);
  }, []);

  const updateBike = useCallback((id, field, value) => {
    setBikes(prev => prev.map((bike) => (bike.id === id ? { ...bike, [field]: value } : bike)));
  }, []);

  const pickImage = useCallback(async (vehicleId, type, imageType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission Required', 'Please allow access to your photos.', [], 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const field = imageType === 'registration' ? 'registrationImageUri' : 'vehicleImageUri';
        
        if (type === 'car') {
          updateCar(vehicleId, field, uri);
        } else {
          updateBike(vehicleId, field, uri);
        }
      }
    } catch (error) {
      console.error('[STEP3] Image picker error:', error);
      showAlert('Error', 'Failed to pick image. Please try again.', [], 'error');
    }
  }, [updateCar, updateBike]);

  const hasAnyVehicleData = () => {
    const allVehicles = [...cars, ...bikes];
    return allVehicles.some(v => 
      v.plateNumber || v.make || v.model || v.color || v.registrationImageUri || v.vehicleImageUri
    );
  };

  // ✅ UPDATED: handleNext with upload progress
  const handleNext = async () => {
    try {
      const allVehicles = [...cars, ...bikes];
      
      // Filter vehicles that have ANY data
      const vehiclesWithData = allVehicles.filter(v => 
        v.plateNumber || v.make || v.model || v.color || v.registrationImageUri || v.vehicleImageUri
      );

      // If user filled some fields, validate and upload
      if (vehiclesWithData.length > 0) {
        // Validate all filled vehicles
        for (const v of vehiclesWithData) {
          if (!v.plateNumber) {
            showAlert('Validation Error', 'Plate number is required for all vehicles', [], 'warning');
            return;
          }
          if (!v.make) {
            showAlert('Validation Error', 'Make is required for all vehicles', [], 'warning');
            return;
          }
          if (!v.model) {
            showAlert('Validation Error', 'Model is required for all vehicles', [], 'warning');
            return;
          }
          if (!v.color) {
            showAlert('Validation Error', 'Color is required for all vehicles', [], 'warning');
            return;
          }
          if (!v.registrationImageUri) {
            showAlert('Image Required', 'Please select registration image for all vehicles', [], 'error');
            return;
          }
          if (!v.vehicleImageUri) {
            showAlert('Image Required', 'Please select vehicle photo for all vehicles', [], 'error');
            return;
          }
        }

        // Start upload process
        setUploading(true);
        setUploadProgress('Preparing vehicle data...');

        // Process vehicles with type information
        const processedVehicles = vehiclesWithData.map(v => ({
          type: cars.includes(v) ? 'car' : 'bike',
          plateNumber: v.plateNumber.toUpperCase(),
          make: v.make.trim(),
          model: v.model.trim(),
          color: v.color.trim(),
          registrationImageUri: v.registrationImageUri,
          vehicleImageUri: v.vehicleImageUri,
        }));

        console.log('[STEP3] Processing vehicles:', processedVehicles.length);

        // ✅ Upload images and save
        await authService.saveStep3(
          processedVehicles,
          (progress) => {
            console.log('[STEP3] Progress:', progress);
            setUploadProgress(progress);
          }
        );

        setUploadProgress('Upload complete!');
        
        // Small delay to show success
        setTimeout(() => {
          setUploading(false);
          router.push('/(auth)/registration/step4');
        }, 500);

      } else {
        // No vehicle data - skip directly
        await authService.saveStep3([], null);
        router.push('/(auth)/registration/step4');
      }
    } catch (error) {
      console.error('[STEP3] Error:', error);
      setUploading(false);
      setUploadProgress('');
      
      showAlert(
        'Upload Failed',
        error.message || 'Failed to upload vehicle images. Please check your internet connection and try again.',
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
      {/* ✅ Upload Progress Modal */}
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 3 of 4</Text>
          <Text style={styles.title}>Vehicle Registration</Text>
          <Text style={styles.subtitle}>Add your vehicles (optional)</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
        </View>

        <View style={styles.form}>
          {/* Car Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="car-outline" size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Cars</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={addCar}
                activeOpacity={0.7}
                disabled={uploading}
              >
                <Ionicons name="add-circle" size={28} color={Colors.secondary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {cars.map((car, index) => (
              <VehicleInputCard
                key={car.id}
                vehicle={car}
                index={index}
                type="car"
                onUpdate={updateCar}
                onRemove={() => removeCar(car.id)}
                canRemove={cars.length > 1}
                onImagePick={pickImage}
              />
            ))}
          </View>

          {/* Bike Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="bicycle-outline" size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.sectionTitle}>Bikes</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={addBike}
                activeOpacity={0.7}
                disabled={uploading}
              >
                <Ionicons name="add-circle" size={28} color={Colors.secondary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {bikes.map((bike, index) => (
              <VehicleInputCard
                key={bike.id}
                vehicle={bike}
                index={index}
                type="bike"
                onUpdate={updateBike}
                onRemove={() => removeBike(bike.id)}
                canRemove={bikes.length > 1}
                onImagePick={pickImage}
              />
            ))}
          </View>

          {/* ✅ UPDATED Info Note */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              {hasAnyVehicleData() 
                ? 'Images will be uploaded to secure cloud storage when you click Next. Please ensure all details are filled correctly.'
                : 'Vehicle registration is optional. You can skip this step and add vehicles later from your profile settings.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {/* ✅ UPDATED: Disable back button during upload */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.secondary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        {/* ✅ UPDATED: Show uploading state */}
        <TouchableOpacity 
          style={[styles.nextButton, uploading && styles.nextButtonDisabled]} 
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={uploading}
        >
          <Text style={styles.nextButtonText}>
            {uploading ? 'Uploading...' : (hasAnyVehicleData() ? 'Next' : 'Skip')}
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vehicleIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  imageSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imageSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadContainerSmall: {
    flex: 1,
  },
  uploadLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  uploadButtonSmall: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  uploadPlaceholderSmall: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  uploadTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
  },
  imagePreviewSmall: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImageSmall: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  imageOverlaySmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
  // ✅ Modal styles
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