import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';

export default function PersonalInfo() {
  const router = useRouter();

  const personalData = {
    fullName: 'Muhammad Ahmed',
    email: 'ahmed@example.com',
    phone: '0321-1234567',
    cnic: '42101-1234567-1',
    houseNumber: 'A-123',
    ownershipStatus: 'Owner Residential',
  };

  const [cars, setCars] = useState([
    { id: 1, plateNumber: 'ABC-123', make: 'Toyota', model: 'Corolla', color: 'White', registrationImage: null, vehicleImage: null },
  ]);
  
  const [bikes, setBikes] = useState([
    { id: 2, plateNumber: 'KHI-789', make: 'Honda', model: 'CD 70', color: 'Black', registrationImage: null, vehicleImage: null },
  ]);

  const addCar = () => {
    setCars([...cars, { id: Date.now(), plateNumber: '', make: '', model: '', color: '', registrationImage: null, vehicleImage: null }]);
  };

  const removeCar = (id) => {
    if (cars.length > 1) {
      setCars(cars.filter((car) => car.id !== id));
    }
  };

  const updateCar = (id, field, value) => {
    setCars(cars.map((car) => (car.id === id ? { ...car, [field]: value } : car)));
  };

  const addBike = () => {
    setBikes([...bikes, { id: Date.now(), plateNumber: '', make: '', model: '', color: '', registrationImage: null, vehicleImage: null }]);
  };

  const removeBike = (id) => {
    if (bikes.length > 1) {
      setBikes(bikes.filter((bike) => bike.id !== id));
    }
  };

  const updateBike = (id, field, value) => {
    setBikes(bikes.map((bike) => (bike.id === id ? { ...bike, [field]: value } : bike)));
  };

  const pickImage = async (vehicleId, type, imageType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: imageType === 'registration' ? [4, 3] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'car') {
        updateCar(vehicleId, imageType === 'registration' ? 'registrationImage' : 'vehicleImage', result.assets[0].uri);
      } else {
        updateBike(vehicleId, imageType === 'registration' ? 'registrationImage' : 'vehicleImage', result.assets[0].uri);
      }
    }
  };

  const handleUpdateRequest = () => {
    Alert.alert(
      'Update Request',
      'Your update request will be sent to the administration for approval.',
      [{ text: 'OK' }]
    );
  };

  const VehicleInputCard = ({ vehicle, index, type, onUpdate, onRemove, canRemove }) => {
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

        {/* Image Upload Section - Side by Side */}
        <View style={styles.imageSection}>
          <Text style={styles.imageSectionTitle}>Upload Documents</Text>
          
          <View style={styles.imagesRow}>
            {/* Registration Paper Upload */}
            <View style={styles.uploadContainerSmall}>
              <Text style={styles.uploadLabelSmall}>Registration Paper</Text>
              <TouchableOpacity 
                style={styles.uploadButtonSmall}
                onPress={() => pickImage(vehicle.id, type, 'registration')}
                activeOpacity={0.7}
              >
                {vehicle.registrationImage ? (
                  <View style={styles.imagePreviewSmall}>
                    <Image source={{ uri: vehicle.registrationImage }} style={styles.previewImageSmall} />
                    <View style={styles.imageOverlaySmall}>
                      <Ionicons name="camera-outline" size={16} color={Colors.white} />
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

            {/* Vehicle Image Upload */}
            <View style={styles.uploadContainerSmall}>
              <Text style={styles.uploadLabelSmall}>Vehicle Photo</Text>
              <TouchableOpacity 
                style={styles.uploadButtonSmall}
                onPress={() => pickImage(vehicle.id, type, 'vehicle')}
                activeOpacity={0.7}
              >
                {vehicle.vehicleImage ? (
                  <View style={styles.imagePreviewSmall}>
                    <Image source={{ uri: vehicle.vehicleImage }} style={styles.previewImageSmall} />
                    <View style={styles.imageOverlaySmall}>
                      <Ionicons name="camera-outline" size={16} color={Colors.white} />
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.infoValue}>{personalData.phone}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC</Text>
              <Text style={styles.infoValue}>{personalData.cnic}</Text>
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
              <Text style={styles.infoValue}>{personalData.ownershipStatus}</Text>
            </View>
          </View>
        </View>

        {/* Vehicles Section - Editable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registered Vehicles</Text>

          {/* Car Section */}
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
              />
            ))}

            {cars.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>No cars registered yet</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={addCar}>
                  <Text style={styles.emptyButtonText}>Add Your First Car</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bike Section */}
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
              />
            ))}

            {bikes.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="bicycle-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyText}>No bikes registered yet</Text>
                <TouchableOpacity style={styles.emptyButton} onPress={addBike}>
                  <Text style={styles.emptyButtonText}>Add Your First Bike</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Update Request Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateRequest}>
          <Ionicons name="create-outline" size={20} color={Colors.white} />
          <Text style={styles.updateButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textLight} />
          <Text style={styles.noteText}>
            Any changes to your personal information or vehicles require approval from the administration.
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
  uploadContainerSmall: {
    flex: 1,
  },
  uploadLabelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
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