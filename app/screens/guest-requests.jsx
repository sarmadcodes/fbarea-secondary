import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../../constants/Colors';
import userService from '../../services/userService';
import guestRequestService from '../../services/guestRequestService';
import { useCustomAlert } from '../../components/CustomAlert';

export default function GuestRequests() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const insets = useSafeAreaInsets();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('submit');
  
  // Form state
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [visitDate, setVisitDate] = useState(new Date());
  const [expectedTime, setExpectedTime] = useState(new Date());
  const [visitType, setVisitType] = useState(null);
  const [customVisitType, setCustomVisitType] = useState('');
  
  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Dropdown state
  const [visitTypeOpen, setVisitTypeOpen] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data state
  const [userData, setUserData] = useState(null);
  const [guestHistory, setGuestHistory] = useState([]);

  // Animation
  const slideAnim = useState(new Animated.Value(0))[0];

  const [visitTypes] = useState([
    { label: 'Guest Visitor', value: 'guest' },
    { label: 'Delivery', value: 'delivery' },
    { label: 'Cab/Taxi', value: 'cab' },
    { label: 'Other', value: 'other' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'submit' ? 0 : 1,
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

      await loadGuestHistory();
    } catch (error) {
      console.error('Load data error:', error);
      showAlert('Error', 'Failed to load data. Please try again.', [], 'error');
    } finally {
      setInitialLoading(false);
    }
  };

  const loadGuestHistory = async () => {
    try {
      const response = await guestRequestService.getMyGuestRequests();
      if (response?.success) {
        setGuestHistory(response.data || []);
      }
    } catch (error) {
      console.error('Load guest history error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuestHistory();
    setRefreshing(false);
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTimeForDisplay = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateForBackend = (date) => {
    // Format: YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForBackend = (date) => {
    // Format: HH:MM AM/PM
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setVisitDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setExpectedTime(selectedTime);
    }
  };

  const validateForm = () => {
    const trimmedGuestName = guestName.trim();

    if (!trimmedGuestName) {
      showAlert('Validation Error', 'Please enter guest name', [], 'warning');
      return false;
    }

    if (trimmedGuestName.length < 2) {
      showAlert('Validation Error', 'Guest name must be at least 2 characters', [], 'warning');
      return false;
    }

    if (trimmedGuestName.length > 100) {
      showAlert('Validation Error', 'Guest name cannot exceed 100 characters', [], 'warning');
      return false;
    }

    // Mobile is optional, but if provided, validate it
    const trimmedGuestMobile = guestMobile.trim();
    if (trimmedGuestMobile && trimmedGuestMobile.length < 10) {
      showAlert('Validation Error', 'Please enter a valid mobile number (at least 10 digits)', [], 'warning');
      return false;
    }

    if (!visitType) {
      showAlert('Validation Error', 'Please select visit type', [], 'warning');
      return false;
    }

    if (visitType === 'other' && !customVisitType.trim()) {
      showAlert('Validation Error', 'Please specify the custom visit type', [], 'warning');
      return false;
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(visitDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showAlert('Validation Error', 'Visit date cannot be in the past', [], 'warning');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setVisitTypeOpen(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const guestData = {
        guestName: guestName.trim(),
        visitDate: formatDateForBackend(visitDate),
        expectedTime: formatTimeForBackend(expectedTime),
        visitType,
      };

      // Add optional fields
      if (guestMobile.trim()) {
        guestData.guestMobile = guestMobile.trim();
      }

      if (visitType === 'other' && customVisitType.trim()) {
        guestData.customVisitType = customVisitType.trim();
      }

      console.log('📤 [GUEST_FORM] Submitting guest request:', JSON.stringify(guestData, null, 2));
      
      const response = await guestRequestService.createGuestRequest(guestData);

      console.log('📥 [GUEST_FORM] Response received:', JSON.stringify(response, null, 2));

      if (response?.success) {
        showAlert(
          'Success',
          response.message || 'Guest request submitted successfully!',
          [],
          'success'
        );

        // Reset form
        setGuestName('');
        setGuestMobile('');
        setVisitDate(new Date());
        setExpectedTime(new Date());
        setVisitType(null);
        setCustomVisitType('');
        
        await loadGuestHistory();
        
        // Switch to history tab
        setActiveTab('history');
      } else {
        throw new Error(response?.message || 'Failed to submit guest request');
      }
      
    } catch (error) {
      console.error('❌ [GUEST_FORM] Submit error:', error);
      
      let errorMessage = 'Failed to submit guest request. Please try again.';
      
      // ✅ IMPROVED: Handle validation errors from backend
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        // Show detailed validation errors
        const errorList = error.validationErrors
          .map(err => `• ${err.field}: ${err.message}`)
          .join('\n');
        
        errorMessage = `Validation failed:\n${errorList}`;
      } 
      // Handle general error response
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // If there are errors array in response data
        if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const errorList = error.response.data.errors
            .map(err => `• ${err.message || err}`)
            .join('\n');
          
          errorMessage = `${error.response.data.message}\n\n${errorList}`;
        }
      } 
      // Handle error message directly
      else if (error.message) {
        errorMessage = error.message;
      }

      console.error('📋 [GUEST_FORM] Error message to display:', errorMessage);

      showAlert('Error', errorMessage, [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      const response = await guestRequestService.deleteGuestRequest(id);
      
      if (response?.success) {
        showAlert(
          'Success',
          'Guest request deleted successfully',
          [],
          'success'
        );
        await loadGuestHistory();
      } else {
        throw new Error(response?.message || 'Failed to delete guest request');
      }
    } catch (error) {
      console.error('Delete guest request error:', error);
      
      let errorMessage = 'Failed to delete guest request. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showAlert('Error', errorMessage, [], 'error');
    }
  };

  const getStatusColor = (status, isExpired) => {
    if (isExpired) return Colors.textLight;
    switch (status) {
      case 'pending':
        return Colors.warning;
      case 'approved':
        return Colors.success;
      case 'rejected':
        return Colors.danger;
      default:
        return Colors.textLight;
    }
  };

  const getStatusText = (status, isExpired) => {
    if (isExpired) return 'EXPIRED';
    return status.toUpperCase();
  };

  const getVisitTypeLabel = (value, custom) => {
    if (value === 'other' && custom) {
      return custom;
    }
    const type = visitTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // ✅ FIXED: Use ScrollView without nested virtualized lists
  const renderSubmitTab = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView 
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContentContainer}
        nestedScrollEnabled={false}
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

        {/* Guest Details Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Guest Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guest Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter guest name"
              value={guestName}
              onChangeText={setGuestName}
              placeholderTextColor={Colors.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Guest Mobile (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., +92 300 1234567"
              value={guestMobile}
              onChangeText={setGuestMobile}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textLight}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visit Date *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
              <Text style={styles.dateTimeButtonText}>{formatDateForDisplay(visitDate)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={visitDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expected Time *</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
              disabled={loading}
            >
              <Ionicons name="time-outline" size={20} color={Colors.secondary} />
              <Text style={styles.dateTimeButtonText}>{formatTimeForDisplay(expectedTime)}</Text>
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={expectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}

          {/* ✅ FIXED: Added listMode="SCROLLVIEW" to prevent FlatList nesting */}
          <View style={[styles.inputGroup, { zIndex: 1000 }]}>
            <Text style={styles.label}>Visit Type *</Text>
            <DropDownPicker
              open={visitTypeOpen}
              value={visitType}
              items={visitTypes}
              setOpen={setVisitTypeOpen}
              setValue={setVisitType}
              placeholder="Select visit type"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholderStyle={{ color: Colors.textLight }}
              disabled={loading}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
            />
          </View>

          {visitType === 'other' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Specify Visit Type *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Plumber, Electrician, etc."
                value={customVisitType}
                onChangeText={setCustomVisitType}
                placeholderTextColor={Colors.textLight}
                editable={!loading}
                maxLength={50}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.white} />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderHistoryTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
      }
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyCount}>
            {guestHistory.length} Request{guestHistory.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {guestHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>No Guest Requests</Text>
            <Text style={styles.emptyStateSubtext}>
              Your submitted guest requests will appear here
            </Text>
          </View>
        ) : (
          guestHistory.map((request) => (
            <View key={request._id} style={[styles.guestCard, { borderLeftColor: getStatusColor(request.status, request.isExpired) }]}>
              <View style={styles.guestHeader}>
                <View style={styles.guestTitleRow}>
                  <Ionicons 
                    name={
                      request.visitType === 'guest' ? 'person' :
                      request.visitType === 'delivery' ? 'cube' :
                      request.visitType === 'cab' ? 'car' : 'ellipsis-horizontal'
                    } 
                    size={20} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.guestName}>{request.guestName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status, request.isExpired) }]}>
                  <Text style={styles.statusText}>{getStatusText(request.status, request.isExpired)}</Text>
                </View>
              </View>

              <View style={styles.guestDetails}>
                {request.guestMobile && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.detailText}>{request.guestMobile}</Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={16} color={Colors.textLight} />
                  <Text style={styles.detailText}>
                    {getVisitTypeLabel(request.visitType, request.customVisitType)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
                  <Text style={styles.detailText}>{request.visitDate}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                  <Text style={styles.detailText}>{request.expectedTime}</Text>
                </View>

                {request.isExpired && (
                  <View style={styles.detailRow}>
                    <Ionicons name="alert-circle-outline" size={16} color={Colors.textLight} />
                    <Text style={[styles.detailText, { color: Colors.textLight }]}>
                      Expired on {formatDate(request.expiresAt)}
                    </Text>
                  </View>
                )}

                {request.adminResponse && (
                  <View style={styles.adminResponseBox}>
                    <Text style={styles.adminResponseLabel}>Admin Response:</Text>
                    <Text style={styles.adminResponseText}>{request.adminResponse}</Text>
                  </View>
                )}
              </View>

              {request.status === 'pending' && !request.isExpired && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    showAlert(
                      'Delete Request',
                      `Are you sure you want to delete the request for ${request.guestName}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDeleteRequest(request._id)
                        }
                      ],
                      'warning'
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <View style={styles.guestFooter}>
                <Text style={styles.submittedText}>
                  Submitted: {formatDate(request.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading guest requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={[styles.headerGradient, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guest Requests</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('submit')}
          >
            <Ionicons 
              name={activeTab === 'submit' ? 'add-circle' : 'add-circle-outline'} 
              size={20} 
              color={activeTab === 'submit' ? Colors.primary : Colors.textLight} 
            />
            <Text style={[styles.tabText, activeTab === 'submit' && styles.activeTabText]}>
              Submit Request
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons 
              name={activeTab === 'history' ? 'time' : 'time-outline'} 
              size={20} 
              color={activeTab === 'history' ? Colors.primary : Colors.textLight} 
            />
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              History
            </Text>
            {guestHistory.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{guestHistory.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200], // Adjust based on screen width
                })
              }]
            }
          ]}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'submit' ? renderSubmitTab() : renderHistoryTab()}

      {/* Alert Component */}
      <AlertComponent />
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textLight,
    fontWeight: '500',
  },

  // Header
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },

  // Tabs
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
  tabContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Info Card
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
    fontWeight: '600',
    color: Colors.textLight,
    width: 60,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  // Form
  formContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
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
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  dateTimeButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 10,
    minHeight: 50,
  },
  dropdownContainer: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // History
  historyContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  historyHeader: {
    marginBottom: 8,
  },
  historyCount: {
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
  guestCard: {
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
    marginBottom: 12,
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  guestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
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
  guestDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
  },
  adminResponseBox: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  adminResponseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 4,
  },
  adminResponseText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 12,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  guestFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submittedText: {
    fontSize: 12,
    color: Colors.textLight,
  },
});