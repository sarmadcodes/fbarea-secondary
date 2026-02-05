import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import userService from '../../services/userService';
import vehicleService from '../../services/vehicleService';
import { useCustomAlert } from '../../components/CustomAlert';

// ✅ Move VehicleInputCard OUTSIDE to prevent keyboard closing
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
          <Text style={styles.cardTitle}>{label} {index + 1}</Text>
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
        <Text style={styles.inputLabel}>Plate Number</Text>
        <TextInput
          style={styles.input}
          placeholder={`e.g., ${type === 'car' ? 'ABC-123' : 'KHI-789'}`}
          placeholderTextColor={Colors.textLight}
          value={vehicle.plateNumber}
          onChangeText={(text) => onUpdate(vehicle.id, 'plateNumber', text)}
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Make</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'car' ? 'Toyota' : 'Honda'}
            placeholderTextColor={Colors.textLight}
            value={vehicle.make}
            onChangeText={(text) => onUpdate(vehicle.id, 'make', text)}
          />
        </View>
        <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Model</Text>
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
        <Text style={styles.inputLabel}>Color</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., White, Black, Red"
          placeholderTextColor={Colors.textLight}
          value={vehicle.color}
          onChangeText={(text) => onUpdate(vehicle.id, 'color', text)}
        />
      </View>

      {/* Images Section */}
      <View style={styles.imageSection}>
        <Text style={styles.imageSectionTitle}>Vehicle Documents</Text>
        <View style={styles.imagesRow}>
          <View style={styles.imageBox}>
            <Text style={styles.imageBoxLabel}>Registration</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => onImagePick(vehicle.id, type, 'registration')}
            >
              {(vehicle.registrationImage?.url || vehicle.registrationImage) ? (
                <Image 
                  source={{ uri: vehicle.registrationImage?.url || vehicle.registrationImage }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="document-text-outline" size={24} color={Colors.textLight} />
                  <Text style={styles.imagePlaceholderText}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.imageBox}>
            <Text style={styles.imageBoxLabel}>Vehicle Photo</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => onImagePick(vehicle.id, type, 'vehicle')}
            >
              {(vehicle.vehicleImage?.url || vehicle.vehicleImage) ? (
                <Image 
                  source={{ uri: vehicle.vehicleImage?.url || vehicle.vehicleImage }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={24} color={Colors.textLight} />
                  <Text style={styles.imagePlaceholderText}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function PersonalInfo() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const vehicleIdCounter = useRef(1000);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [personalData, setPersonalData] = useState(null);
  const [cars, setCars] = useState([]);
  const [bikes, setBikes] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [approvedChanges, setApprovedChanges] = useState(0); // ✅ NEW
  const [rejectedChanges, setRejectedChanges] = useState(0); // ✅ NEW

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [profileResponse, pendingRequestsResponse, allRequestsResponse] = await Promise.all([
        userService.getProfile(),
        vehicleService.getUserChangeRequests('pending'), // ✅ FIXED: Explicitly get pending
        vehicleService.getUserChangeRequests('all'), // ✅ NEW: Get all to check approved/rejected
      ]);
      
      if (profileResponse.data) {
        setPersonalData(profileResponse.data.user);
        
        const vehicles = profileResponse.data.vehicles || [];
        console.log('[PersonalInfo] 🚗 Fetched vehicles:', vehicles.length, vehicles);
        
        const carList = vehicles.filter(v => v.type === 'car').map((v, i) => ({
          ...v,
          id: v._id || i
        }));
        const bikeList = vehicles.filter(v => v.type === 'bike').map((v, i) => ({
          ...v,
          id: v._id || i + 100
        }));
        
        setCars(carList.length > 0 ? carList : [{ 
          id: vehicleIdCounter.current++, 
          plateNumber: '', 
          make: '', 
          model: '', 
          color: '', 
          registrationImage: null, 
          vehicleImage: null,
          isNew: true
        }]);
        
        setBikes(bikeList.length > 0 ? bikeList : [{ 
          id: vehicleIdCounter.current++, 
          plateNumber: '', 
          make: '', 
          model: '', 
          color: '', 
          registrationImage: null, 
          vehicleImage: null,
          isNew: true
        }]);
      }

      // ✅ FIXED: Only set pending requests
      if (pendingRequestsResponse?.data) {
        console.log('[PersonalInfo] ⏳ Pending change requests:', pendingRequestsResponse.data.length);
        setPendingChanges(pendingRequestsResponse.data);
      }

      // ✅ NEW: Check for recently approved/rejected requests (last 24 hours)
      if (allRequestsResponse?.data) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentApproved = allRequestsResponse.data.filter(r => 
          r.status === 'approved' && new Date(r.reviewedAt) > oneDayAgo
        ).length;
        const recentRejected = allRequestsResponse.data.filter(r => 
          r.status === 'rejected' && new Date(r.reviewedAt) > oneDayAgo
        ).length;
        
        setApprovedChanges(recentApproved);
        setRejectedChanges(recentRejected);
      }
    } catch (error) {
      console.error('[PersonalInfo] Error fetching data:', error);
      if (!isRefresh) {
        showAlert('Error', error.message || 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchUserData(true);
  }, []);

  const addCar = useCallback(() => {
    setCars(prev => [...prev, { 
      id: vehicleIdCounter.current++, 
      plateNumber: '', 
      make: '', 
      model: '', 
      color: '', 
      registrationImage: null, 
      vehicleImage: null,
      isNew: true
    }]);
  }, []);

  const removeCar = useCallback((id) => {
    const car = cars.find(c => c.id === id);
    
    if (car._id) {
      showAlert('Delete Vehicle', 'This will create a delete request pending admin approval. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await vehicleService.deleteVehicle(car._id);
                showAlert(
                  'Success', 
                  'Delete request submitted for admin approval',
                  [{ text: 'OK', onPress: () => fetchUserData() }], 'warning');
              } catch (error) {
                showAlert('Error', error.message || 'Failed to submit delete request');
              }
            },
          },
        ]
      );
    } else {
      setCars(prev => prev.length > 1 ? prev.filter((c) => c.id !== id) : prev);
    }
  }, [cars]);

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
      registrationImage: null, 
      vehicleImage: null,
      isNew: true
    }]);
  }, []);

  const removeBike = useCallback((id) => {
    const bike = bikes.find(b => b.id === id);
    
    if (bike._id) {
      showAlert('Delete Vehicle', 'This will create a delete request pending admin approval. Continue?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await vehicleService.deleteVehicle(bike._id);
                showAlert(
                  'Success', 
                  'Delete request submitted for admin approval',
                  [{ text: 'OK', onPress: () => fetchUserData() }], 'warning');
              } catch (error) {
                showAlert('Error', error.message || 'Failed to submit delete request');
              }
            },
          },
        ]
      );
    } else {
      setBikes(prev => prev.length > 1 ? prev.filter((b) => b.id !== id) : prev);
    }
  }, [bikes]);

  const updateBike = useCallback((id, field, value) => {
    setBikes(prev => prev.map((bike) => (bike.id === id ? { ...bike, [field]: value } : bike)));
  }, []);

  const pickImage = async (vehicleId, type, imageType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('Permission Required', 'Please allow access to your photos to upload images.', [], 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: imageType === 'registration' ? [4, 3] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        if (type === 'car') {
          updateCar(vehicleId, imageType === 'registration' ? 'registrationImage' : 'vehicleImage', uri);
        } else {
          updateBike(vehicleId, imageType === 'registration' ? 'registrationImage' : 'vehicleImage', uri);
        }
      }
    } catch (error) {
      console.error('[PersonalInfo] Image picker error:', error);
      showAlert('Error', 'Failed to pick image. Please try again.', [], 'error');
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      const allVehicles = [...cars, ...bikes];
      const vehiclesWithData = allVehicles.filter(v => v.plateNumber?.trim());
      
      if (vehiclesWithData.length === 0) {
        showAlert('Info', 'No changes to save', [], 'error');
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      
      for (const vehicle of vehiclesWithData) {
        try {
          // Validate required fields
          if (!vehicle.make || !vehicle.model || !vehicle.color) {
            showAlert('Validation Error', `Please fill all fields for ${vehicle.plateNumber}`);
            return;
          }

          const vehicleData = {
            type: vehicle.type || (cars.includes(vehicle) ? 'car' : 'bike'),
            plateNumber: vehicle.plateNumber.trim(),
            make: vehicle.make.trim(),
            model: vehicle.model.trim(),
            color: vehicle.color.trim(),
          };
          
          const images = {
            registrationImage: vehicle.registrationImage,
            vehicleImage: vehicle.vehicleImage,
          };
          
          if (vehicle._id && !vehicle.isNew) {
            await vehicleService.updateVehicle(vehicle._id, vehicleData, images);
            successCount++;
          } else if (vehicle.isNew) {
            await vehicleService.addVehicle(vehicleData, images);
            successCount++;
          }
        } catch (error) {
          console.error('[PersonalInfo] Error saving vehicle:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        showAlert(
          'Success',
          `${successCount} change request(s) submitted for admin approval.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
          [{ text: 'OK', onPress: () => fetchUserData() }]
        );
      } else if (errorCount > 0) {
        showAlert('Error', 'Failed to submit changes. Please try again.', [], 'error');
      }
    } catch (error) {
      console.error('[PersonalInfo] Error in handleSaveChanges:', error);
      showAlert('Error', error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!personalData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={Colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.secondary]}
            tintColor={Colors.secondary}
          />
        }
      >
        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{personalData.fullName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{personalData.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{personalData.phoneNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC</Text>
              <Text style={styles.infoValue}>{personalData.cnicNumber}</Text>
            </View>
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>House Number</Text>
              <Text style={styles.infoValue}>{personalData.houseNumber}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ownership Status</Text>
              <Text style={styles.infoValue}>
                {personalData.ownershipStatus?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          </View>
        </View>

        {/* ✅ FIXED: Pending Changes Notice - Only show if there are PENDING requests */}
        {pendingChanges.length > 0 && (
          <View style={styles.pendingNotice}>
            <Ionicons name="time-outline" size={20} color={Colors.warning} />
            <Text style={styles.pendingText}>
              You have {pendingChanges.length} pending change request(s) awaiting admin approval
            </Text>
          </View>
        )}

        {/* ✅ NEW: Approved Changes Notice */}
        {approvedChanges > 0 && (
          <View style={styles.successNotice}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.successText}>
              {approvedChanges} vehicle change request(s) have been approved! Pull down to refresh.
            </Text>
          </View>
        )}

        {/* ✅ NEW: Rejected Changes Notice */}
        {rejectedChanges > 0 && (
          <View style={styles.errorNotice}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.errorText}>
              {rejectedChanges} vehicle change request(s) were rejected. Please contact admin for details.
            </Text>
          </View>
        )}

        {/* Vehicles Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Vehicles</Text>

          {/* Cars */}
          <View style={styles.vehicleSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="car-outline" size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.sectionSubtitle}>Cars</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={addCar}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={28} color={Colors.secondary} />
                <Text style={styles.addButtonText}>Add Car</Text>
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

          {/* Bikes */}
          <View style={styles.vehicleSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="bicycle-outline" size={20} color={Colors.secondary} />
                </View>
                <Text style={styles.sectionSubtitle}>Bikes</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={addBike}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={28} color={Colors.secondary} />
                <Text style={styles.addButtonText}>Add Bike</Text>
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
        </View>

        <TouchableOpacity 
          style={[styles.updateButton, saving && styles.updateButtonDisabled]} 
          onPress={handleSaveChanges}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="create-outline" size={20} color={Colors.white} />
              <Text style={styles.updateButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textLight} />
          <Text style={styles.noteText}>
            Any changes to your vehicles require approval from the administration. Pull down to refresh and see approved changes.
          </Text>
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
  refreshButton: {
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
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '600',
  },
  // ✅ NEW: Success notice styles
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  // ✅ NEW: Error notice styles
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  vehicleSection: {
    marginBottom: 24,
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
  sectionSubtitle: {
    fontSize: 16,
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
  imageBox: {
    flex: 1,
  },
  imageBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  imageContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: '100%',
    height: 80,
  },
  imagePlaceholder: {
    backgroundColor: Colors.background,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  imagePlaceholderText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
  },
  updateButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.7,
  },
  updateButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 18,
  },
});