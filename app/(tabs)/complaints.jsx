import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Image,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import complaintService from '../../services/complaintService';
import authService from '../../services/authService';
import userService from '../../services/userService';
import { useCustomAlert } from '../../components/CustomAlert';

export default function Complaints() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('write'); // 'write' or 'recent'
  
  // Form state
  const [complaintType, setComplaintType] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [complaint, setComplaint] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Image state
  
  // Dropdown state
  const [typeOpen, setTypeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedComplaintNumber, setSubmittedComplaintNumber] = useState('');
  
  // Data state
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [userData, setUserData] = useState(null);

  // Animation
  const slideAnim = useState(new Animated.Value(0))[0];

  const [complaintTypes] = useState([
    { label: 'Water Supply Issue', value: 'water' },
    { label: 'Electricity Supply Issue', value: 'electricity' },
    { label: 'Maintenance Issue', value: 'maintenance' },
    { label: 'Security Concern', value: 'security' },
    { label: 'Noise Complaint', value: 'noise' },
    { label: 'Other', value: 'other' },
  ]);

  const [priorities] = useState([
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      router.push('/(tabs)');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  // Animate tab switch
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'write' ? 0 : 1,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      
      const profileResponse = await userService.getProfile();
      if (profileResponse?.data?.user) {
        setUserData(profileResponse.data.user);
        console.log('User data loaded:', profileResponse.data.user.fullName);
      } else {
        throw new Error('Failed to load user profile');
      }

      await loadRecentComplaints();
    } catch (error) {
      console.error('Load data error:', error);
      showAlert('Error', 'Failed to load data. Please try again.', [], 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRecentComplaints = async () => {
    try {
      const response = await complaintService.getRecentComplaints();
      if (response.success) {
        setRecentComplaints(response.data || []);
        console.log(`Loaded ${response.data?.length || 0} recent complaints`);
      }
    } catch (error) {
      console.error('Load complaints error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecentComplaints();
    setRefreshing(false);
  }, []);

  // Handle image selection
  const handleImageSelection = () => {
    const options = ['Take Photo', 'Upload from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await handleTakePhoto();
          } else if (buttonIndex === 1) {
            await handlePickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Complaint Image',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            text: 'Upload from Gallery',
            onPress: handlePickImage,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  // ✅ Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert(
          'Permission Required',
          'Camera permission is required to take photos',
          [],
          'warning'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        console.log('📸 Photo taken:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      showAlert('Error', 'Failed to take photo. Please try again.', [], 'error');
    }
  };

  // ✅ Pick image from gallery
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert(
          'Permission Required',
          'Gallery permission is required to select images',
          [],
          'warning'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        console.log('🖼️ Image selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showAlert('Error', 'Failed to select image. Please try again.', [], 'error');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const validateForm = () => {
    const trimmedComplaint = complaint.trim();

    if (!complaintType) {
      showAlert('Validation Error', 'Please select a complaint type', [], 'warning');
      return false;
    }

    if (!priority) {
      showAlert('Validation Error', 'Please select a priority level', [], 'warning');
      return false;
    }

    if (!trimmedComplaint) {
      showAlert('Validation Error', 'Please enter a complaint description', [], 'warning');
      return false;
    }

    if (trimmedComplaint.length < 10) {
      showAlert('Validation Error', 'Description must be at least 10 characters long', [], 'warning');
      return false;
    }

    if (trimmedComplaint.length > 1000) {
      showAlert('Validation Error', 'Description cannot exceed 1000 characters', [], 'warning');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    // Close dropdowns
    setTypeOpen(false);
    setPriorityOpen(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('complaintType', complaintType);
      formData.append('priority', priority);
      formData.append('description', complaint.trim());

      // Add image if selected
      if (selectedImage) {
        const uriParts = selectedImage.uri.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        
        // Validate file type
        const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!validTypes.includes(fileType)) {
          showAlert('Invalid File', 'Please select a valid image file (JPG, PNG, GIF, WEBP)', [], 'warning');
          setLoading(false);
          return;
        }
        
        formData.append('complaintImage', {
          uri: selectedImage.uri,
          name: `complaint-${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        });
        
        console.log('📤 Uploading complaint with image...');
      } else {
        console.log('📤 Uploading complaint without image...');
      }

      // Submit complaint
      const response = await complaintService.createComplaint(formData);

      if (response.success) {
        const complaintNumber = response.data?.complaintNumber || 'N/A';
        
        // Clear form
        setComplaintType(null);
        setPriority('medium');
        setComplaint('');
        setSelectedImage(null);
        
        // Show success modal
        setSubmittedComplaintNumber(complaintNumber);
        setShowSuccessModal(true);
        
        console.log('✅ Complaint submitted successfully:', complaintNumber);
      } else {
        throw new Error(response.message || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      let errorMessage = 'Failed to submit complaint. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage += '\n\n' + errors.map(e => `• ${e.message}`).join('\n');
      }

      showAlert('Error', errorMessage, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'in_progress':
        return '#3498db';
      case 'resolved':
        return Colors.success;
      case 'rejected':
        return Colors.danger;
      default:
        return Colors.textLight;
    }
  };

  const getStatusText = (status) => {
    return status.toUpperCase().replace('_', ' ');
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return Colors.danger || '#DC3545';
      case 'high':
        return '#FF6B35';
      case 'medium':
        return Colors.warning || '#FFC107';
      case 'low':
        return '#95E1D3';
      default:
        return Colors.textLight || '#6C757D';
    }
  };

  const getComplaintTypeLabel = (value) => {
    const type = complaintTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const complaintDate = new Date(date);
    const diffInMs = now - complaintDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  const handleViewRecent = () => {
    setShowSuccessModal(false);
    setActiveTab('recent');
    // Reload complaints to show the new one
    loadRecentComplaints();
  };

  const handleSubmitAnother = () => {
    setShowSuccessModal(false);
    // Form is already cleared in handleSubmit
    // Just reload complaints to update the count
    loadRecentComplaints();
  };

  const renderWriteTab = () => (
    <ScrollView 
      style={styles.tabContent}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={!typeOpen && !priorityOpen}
    >
      {/* Resident Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color={Colors.secondary} />
          <Text style={styles.infoLabel}>Name:</Text>
          <Text style={styles.infoValue}>{userData?.fullName || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={20} color={Colors.secondary} />
          <Text style={styles.infoLabel}>CNIC:</Text>
          <Text style={styles.infoValue}>{userData?.cnicNumber || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="home-outline" size={20} color={Colors.secondary} />
          <Text style={styles.infoLabel}>House:</Text>
          <Text style={styles.infoValue}>{userData?.houseNumber || 'N/A'}</Text>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={[styles.inputGroup, { zIndex: 3000 }]}>
          <Text style={styles.label}>Complaint Type *</Text>
          <DropDownPicker
            open={typeOpen}
            value={complaintType}
            items={complaintTypes}
            setOpen={(open) => {
              setTypeOpen(open);
              if (open) setPriorityOpen(false);
            }}
            setValue={setComplaintType}
            placeholder="Select complaint type"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            maxHeight={250}
            dropDownDirection="BOTTOM"
            disableBorderRadius={false}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        <View style={[styles.inputGroup, { zIndex: 2000 }]}>
          <Text style={styles.label}>Priority Level *</Text>
          <DropDownPicker
            open={priorityOpen}
            value={priority}
            items={priorities}
            setOpen={(open) => {
              setPriorityOpen(open);
              if (open) setTypeOpen(false);
            }}
            setValue={setPriority}
            placeholder="Select priority"
            style={styles.dropdown}
            dropDownContainerStyle={styles.dropdownContainer}
            textStyle={styles.dropdownText}
            listMode="SCROLLVIEW"
            scrollViewProps={{
              nestedScrollEnabled: true,
            }}
            maxHeight={250}
            dropDownDirection="BOTTOM"
            disableBorderRadius={false}
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        <View style={[styles.inputGroup, { zIndex: 1 }]}>
          <Text style={styles.label}>Complaint Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your complaint in detail (minimum 10 characters)..."
            placeholderTextColor={Colors.textLight}
            value={complaint}
            onChangeText={setComplaint}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.characterCount}>
            {complaint.trim().length}/1000 characters
          </Text>
        </View>

        {/* Image Upload Section */}
        <View style={[styles.inputGroup, { zIndex: 0 }]}>
          <Text style={styles.label}>Complaint Image (Optional)</Text>
          
          {selectedImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.imagePreview}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={32} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleImageSelection}
            >
              <Ionicons name="cloud-upload-outline" size={48} color={Colors.primary} />
              <Text style={styles.uploadButtonText}>Add Image</Text>
              <Text style={styles.uploadButtonSubtext}>
                Tap to take a photo or upload from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator color={Colors.white} />
              <Text style={styles.submitButtonText}>
                {selectedImage ? 'Uploading...' : 'Submitting...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Guidelines */}
      <View style={[styles.guidelines, { zIndex: 0 }]}>
        <Text style={styles.guidelinesTitle}>Complaint Guidelines</Text>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>
            Provide clear and accurate details about your complaint
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>
            Select appropriate priority based on urgency
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>
            You will receive a unique complaint number for tracking
          </Text>
        </View>
        <View style={styles.guidelineItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
          <Text style={styles.guidelineText}>
            Adding an image can help us better understand your issue
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderRecentTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {recentComplaints.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyStateText}>No complaints submitted yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Submit your first complaint using the Write tab
          </Text>
        </View>
      ) : (
        <View style={styles.complaintsContainer}>
          <View style={styles.complaintsHeader}>
            <Text style={styles.complaintsCount}>
              Showing {recentComplaints.length} complaint{recentComplaints.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {recentComplaints.map((item, index) => (
            <View key={item._id} style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <View style={styles.complaintTitleRow}>
                  <Text style={styles.complaintTitle}>
                    {getComplaintTypeLabel(item.complaintType)}
                  </Text>
                  <View style={styles.complaintNumberBadge}>
                    <Text style={styles.complaintNumberLabel}>#</Text>
                    <Text style={styles.complaintNumber}>
                      {item.complaintNumber}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.complaintText} numberOfLines={2}>
                {item.description}
              </Text>
              
              {/* Show image thumbnail if exists */}
              {item.complaintImage?.url && (
                <View style={styles.complaintImageThumbnailContainer}>
                  <Image
                    source={{ uri: item.complaintImage.url }}
                    style={styles.complaintImageThumbnail}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('Image load error:', error.nativeEvent.error);
                    }}
                  />
                  <View style={styles.imageIconBadge}>
                    <Ionicons name="image" size={12} color={Colors.white} />
                  </View>
                </View>
              )}
              
              {item.adminResponse && (
                <View style={styles.adminResponseContainer}>
                  <View style={styles.adminResponseHeader}>
                    <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                    <Text style={styles.adminResponseLabel}>Admin Response</Text>
                  </View>
                  <Text style={styles.adminResponseText}>{item.adminResponse}</Text>
                </View>
              )}
              
              <View style={styles.complaintFooter}>
                <View style={styles.footerLeft}>
                  <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                  <Text style={styles.complaintDate}>
                    {getTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <View style={[
                  styles.priorityBadge, 
                  { backgroundColor: getPriorityColor(item.priority) },
                  item.priority === 'urgent' && styles.priorityBadgeUrgent
                ]}>
                  {item.priority === 'urgent' && (
                    <Ionicons name="alert-circle" size={12} color={Colors.white} style={{ marginRight: 4 }} />
                  )}
                  <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" />

      {/* Custom Alert */}
      <AlertComponent />
      
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            
            <Text style={styles.modalTitle}>Complaint Submitted!</Text>
            <Text style={styles.modalMessage}>
              Your complaint has been successfully submitted and will be reviewed soon.
            </Text>
            
            <Text style={styles.modalComplaintNumber}>#{submittedComplaintNumber}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={handleSubmitAnother}
              >
                <Text style={styles.modalButtonSecondaryText}>Submit Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleViewRecent}
              >
                <Text style={styles.modalButtonPrimaryText}>View Recent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaints</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'write' && styles.activeTab]}
            onPress={() => setActiveTab('write')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={activeTab === 'write' ? 'create' : 'create-outline'} 
              size={20} 
              color={activeTab === 'write' ? Colors.primary : Colors.textLight} 
            />
            <Text style={[styles.tabText, activeTab === 'write' && styles.activeTabText]}>
              Write Complaint
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Recent Complaints
            </Text>
            {recentComplaints.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{recentComplaints.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Active Tab Indicator */}
        <Animated.View 
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 190], // Approximate half width
                })
              }]
            }
          ]} 
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'write' ? renderWriteTab() : renderRecentTab()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
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
  
  // Tab Styles
  tabContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  activeTab: {
    // Styles managed by indicator
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textLight,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  tabIndicator: {
    height: 3,
    backgroundColor: Colors.primary,
    width: '50%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  
  // Content Styles
  tabContent: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '600',
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  form: {
    marginBottom: 24,
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
  dropdown: {
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    minHeight: 50,
  },
  dropdownContainer: {
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: Colors.white,
    color: Colors.text,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  // Image Upload Styles
  uploadButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  uploadButtonSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
  },
  complaintImageThumbnailContainer: {
    position: 'relative',
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  complaintImageThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  imageIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 6,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  guidelines: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  
  // Recent Complaints Styles
  complaintsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  complaintsHeader: {
    marginBottom: 8,
  },
  complaintsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textLight,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  complaintCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  complaintTitleRow: {
    flex: 1,
    marginRight: 8,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  complaintNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  complaintNumberLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 2,
  },
  complaintNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  complaintText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  adminResponseContainer: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminResponseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  adminResponseText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  complaintDate: {
    fontSize: 12,
    color: Colors.textLight,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeUrgent: {
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  priorityText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalComplaintNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  modalButtonSecondaryText: {
    color: Colors.secondary,
    fontSize: 15,
    fontWeight: '700',
  },
});