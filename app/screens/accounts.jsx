import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import Colors from '../../constants/Colors';
import paymentService from '../../services/paymentService';
import notificationService from '../../services/notificationService';
import { useCustomAlert } from '../../components/CustomAlert';

export default function Accounts() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState([]);
  
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  // ✅ NEW: Notification state
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const notificationUnsubscribeRef = useRef(null);

  // ✅ Prevent duplicate requests with ref
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // ✅ Clean up notification listener
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    loadData();
    
    // ✅ NEW: Subscribe to payment notifications
    // setupNotificationListener();
    
    return () => {
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadPaymentForMonth(selectedMonth);
    }
  }, [selectedMonth]);

  // ✅ NEW: Setup notification listener for payment updates
  const setupNotificationListener = () => {
    console.log('🔔 [Accounts] Setting up payment notification listener...');
    
    const unsubscribe = notificationService.subscribeToNotifications((data) => {
      console.log('🔔 [Accounts] Received notification:', data.type);
      
      if (data.type === 'payment' && data.notifications && data.notifications.length > 0) {
        const latestNotification = data.notifications[0];
        
        console.log('💰 [Accounts] Payment notification received:', latestNotification.title);
        
        // Show in-app alert
        showPaymentNotificationAlert(latestNotification);
        
        // Mark as having new notification
        setHasNewNotification(true);
        
        // Reload payment data
        loadData(true);
        if (selectedMonth) {
          loadPaymentForMonth(selectedMonth);
        }
      }
    });
    
    notificationUnsubscribeRef.current = unsubscribe;
  };

  // ✅ NEW: Show in-app alert for payment notifications
  const showPaymentNotificationAlert = (notification) => {
    const isApproved = notification.title.includes('Approved');
    const isRejected = notification.title.includes('Rejected');
    
    Alert.alert(
      notification.title,
      notification.message,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Mark notification as read
            notificationService.markAsRead(notification._id).catch(err => 
              console.error('Failed to mark as read:', err)
            );
            
            // Reload data
            loadData(true);
            if (selectedMonth) {
              loadPaymentForMonth(selectedMonth);
            }
          }
        },
        {
          text: 'OK',
          onPress: () => {
            // Mark notification as read
            notificationService.markAsRead(notification._id).catch(err => 
              console.error('Failed to mark as read:', err)
            );
            setHasNewNotification(false);
          }
        }
      ],
      { cancelable: false }
    );
  };

  // ✅ OPTIMIZED: Prevent duplicate API calls with loading flag
  const loadData = async (isRefresh = false) => {
    // ✅ Prevent duplicate calls
    if (loadingRef.current && !isRefresh) {
      console.log('⏭️ Skipping duplicate loadData call');
      return;
    }

    try {
      loadingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // ✅ Cancel previous request if exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // ✅ CRITICAL FIX: Run all API calls in PARALLEL (much faster!)
      const [
        monthsResponse,
        statsResponse,
        historyResponse,
        bankResponse,
      ] = await Promise.allSettled([
        paymentService.getAvailableMonths(),
        paymentService.getPaymentStats(),
        paymentService.getPaymentHistory(10),
        paymentService.getBankDetails(),
      ]);

      // ✅ Handle months data
      if (monthsResponse.status === 'fulfilled' && monthsResponse.value?.data) {
        const availableMonths = monthsResponse.value.data;
        setMonths(availableMonths);

        // Set current month as default (only if not already set)
        if (availableMonths.length > 0 && !selectedMonth) {
          setSelectedMonth(availableMonths[0].value);
        }
      } else {
        console.error('Failed to load months:', monthsResponse.reason);
        setMonths([]);
      }

      // ✅ Handle stats data
      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        setStats(statsResponse.value.data);
      } else {
        console.error('Failed to load stats:', statsResponse.reason);
        setStats(null);
      }

      // ✅ Handle history data
      if (historyResponse.status === 'fulfilled' && historyResponse.value?.data) {
        setPaymentHistory(historyResponse.value.data);
      } else {
        console.error('Failed to load history:', historyResponse.reason);
        setPaymentHistory([]);
      }

      // ✅ Handle bank details
      if (bankResponse.status === 'fulfilled' && bankResponse.value?.data) {
        setBankDetails(bankResponse.value.data);
      } else {
        console.error('Failed to load bank details:', bankResponse.reason);
      }

      // ✅ Only show error if ALL requests failed
      const allFailed = [monthsResponse, statsResponse, historyResponse, bankResponse]
        .every(r => r.status === 'rejected');

      if (allFailed) {
        showAlert('Connection Error', 'Failed to load payment data. Please check your internet connection and try again.', [{ text: 'Retry', onPress: () => loadData(false) }], 'error');
      }

    } catch (error) {
      // ✅ Ignore abort errors
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }

      console.error('Error loading data:', error);
      showAlert('Error', 'Something went wrong. Please try again.', [{ text: 'Retry', onPress: () => loadData(false) }], 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  };

  // ✅ OPTIMIZED: Debounced pull-to-refresh
  const onRefresh = async () => {
    if (loadingRef.current) {
      console.log('⏭️ Skipping duplicate refresh');
      return;
    }

    console.log('🔄 Refreshing payment data...');
    await loadData(true);
    
    // Also reload current payment if a month is selected
    if (selectedMonth) {
      await loadPaymentForMonth(selectedMonth);
    }
    
    // Clear new notification badge
    setHasNewNotification(false);
  };

  const loadPaymentForMonth = async (month) => {
    try {
      const response = await paymentService.getPaymentByMonth(month);
      setCurrentPayment(response.data);
    } catch (error) {
      console.error('Error loading payment:', error);
      setCurrentPayment(null);
    }
  };

  const handlePayNow = () => {
    if (!currentPayment) {
      showAlert('Error', 'No payment selected', [], 'error');
      return;
    }

    if (currentPayment.status === 'approved') {
      showAlert('Already Paid', 'This payment has already been approved', [], 'error');
      return;
    }

    if (currentPayment.status === 'submitted') {
      showAlert(
        'Payment Submitted',
        'Your payment proof has been submitted and is awaiting admin approval.'
      );
      return;
    }

    setPaymentModalVisible(true);
  };

  const handleProceedToPayment = () => {
    setPaymentModalVisible(false);
    setUploadModalVisible(true);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      showAlert('Permission Required', 'Please allow access to your photos', [], 'warning');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedImage) {
      showAlert('Error', 'Please upload payment screenshot', [], 'error');
      return;
    }

    // ✅ Prevent duplicate submissions
    if (submitting) {
      console.log('⏭️ Already submitting payment...');
      return;
    }

    try {
      setSubmitting(true);

      await paymentService.submitPaymentProof(
        currentPayment._id,
        selectedImage,
        transactionId,
        remarks
      );

      showAlert('Success', 'Payment proof submitted successfully! Waiting for admin approval.', [{ text: 'OK', onPress: () => {
          setUploadModalVisible(false);
          setSelectedImage(null);
          setTransactionId('');
          setRemarks('');
          // ✅ Only reload once, not twice
          loadData(false);
          if (selectedMonth) {
            loadPaymentForMonth(selectedMonth);
          }
        }}], 'success');
    } catch (error) {
      showAlert('Error', error.message || 'Failed to submit payment proof');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'submitted':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.error;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'PAID';
      case 'submitted':
        return 'SUBMITTED';
      case 'rejected':
        return 'REJECTED';
      default:
        return 'PENDING';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <View
          style={[
            styles.historyIcon,
            { backgroundColor: item.status === 'approved' ? '#E8F5E9' : '#FFEBEE' },
          ]}
        >
          <Ionicons
            name={item.status === 'approved' ? 'checkmark-circle' : 'time-outline'}
            size={24}
            color={getStatusColor(item.status)}
          />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyMonth}>{item.monthDisplay}</Text>
          <Text style={styles.historyDate}>
            {formatDate(item.paidDate || item.submittedAt)}
          </Text>
        </View>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyAmount}>
          Rs. {item.amount.toLocaleString()}
        </Text>
        <View
          style={[
            styles.historyStatus,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.historyStatusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      

      {/* Custom Alert */}
      <AlertComponent />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        {/* ✅ NEW: Notification badge */}
        <View>
          {hasNewNotification && (
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications" size={20} color={Colors.white} />
              <View style={styles.badgeDot} />
            </View>
          )}
        </View>
      </LinearGradient>

      <FlatList
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* ✅ NEW: Update notification banner */}
            {hasNewNotification && (
              <TouchableOpacity 
                style={styles.updateBanner}
                onPress={onRefresh}
              >
                <Ionicons name="information-circle" size={20} color={Colors.white} />
                <Text style={styles.updateBannerText}>
                  Payment status updated! Pull down to refresh
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
            
            {/* Month Selector */}
            <View style={[styles.section, { zIndex: 1000 }]}>
              <Text style={styles.sectionTitle}>Select Month</Text>
              <DropDownPicker
                open={open}
                value={selectedMonth}
                items={months}
                setOpen={setOpen}
                setValue={setSelectedMonth}
                setItems={setMonths}
                placeholder="Select month"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
              />
            </View>

            {/* Current Payment Card */}
            {currentPayment && (
              <View style={styles.section}>
                <View style={styles.balanceCard}>
                  <LinearGradient
                    colors={
                      currentPayment.status === 'approved'
                        ? ['#4CAF50', '#45a049']
                        : currentPayment.status === 'submitted'
                        ? ['#FF9800', '#F57C00']
                        : ['#FF512F', '#DD2476']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceGradient}
                  >
                    <Text style={styles.balanceLabel}>Monthly Maintenance</Text>
                    <Text style={styles.balanceAmount}>
                      Rs. {currentPayment.amount.toLocaleString()}
                    </Text>
                    <View style={styles.balanceStatus}>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>
                          {getStatusText(currentPayment.status)}
                        </Text>
                      </View>
                    </View>
                    {currentPayment.status === 'submitted' && (
                      <Text style={styles.submittedText}>
                        Awaiting admin approval
                      </Text>
                    )}
                    {currentPayment.status === 'rejected' && currentPayment.rejectionReason && (
                      <Text style={styles.submittedText}>
                        Reason: {currentPayment.rejectionReason}
                      </Text>
                    )}
                  </LinearGradient>
                </View>

                {currentPayment.status !== 'approved' && (
                  <TouchableOpacity
                    style={[
                      styles.payButton,
                      currentPayment.status === 'submitted' && styles.disabledButton
                    ]}
                    onPress={handlePayNow}
                    disabled={currentPayment.status === 'submitted'}
                  >
                    <Ionicons name="card-outline" size={24} color={Colors.white} />
                    <Text style={styles.payButtonText}>
                      {currentPayment.status === 'submitted' ? 'Payment Submitted' : 'Pay Now'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Payment History Header */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment History</Text>
            </View>
          </>
        }
        data={paymentHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => item._id || index.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No payment history yet</Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
            </Text>
          </View>
        }
        ListFooterComponent={
          stats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Summary</Text>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Paid</Text>
                  <Text style={styles.summaryValue}>
                    Rs. {stats.amountPaid?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pending Amount</Text>
                  <Text style={[styles.summaryValue, { color: Colors.error }]}>
                    Rs. {stats.amountPending?.toLocaleString() || '0'}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payments Completed</Text>
                  <Text style={styles.summaryValue}>
                    {stats.totalPaid || 0} / {stats.totalPayments || 0}
                  </Text>
                </View>
              </View>
            </View>
          )
        }
      />

      {/* Payment Confirmation Modal */}
      <Modal
        visible={paymentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Confirmation</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              {bankDetails && (
                <>
                  <View style={styles.bankDetailsCard}>
                    <Text style={styles.bankDetailsTitle}>Bank Details</Text>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Bank Name:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.bankName}</Text>
                    </View>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Account Title:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.accountTitle}</Text>
                    </View>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Account Number:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.accountNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.paymentDetail}>
                    <Text style={styles.paymentDetailLabel}>Amount to Pay</Text>
                    <Text style={styles.paymentDetailValue}>
                      Rs. {currentPayment?.amount.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.paymentDetail}>
                    <Text style={styles.paymentDetailLabel}>Month</Text>
                    <Text style={styles.paymentDetailValue}>
                      {currentPayment?.monthDisplay}
                    </Text>
                  </View>
                </>
              )}

              <Text style={styles.modalNote}>
                Please transfer the amount to the above bank account and upload the payment
                screenshot on the next screen.
              </Text>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleProceedToPayment}
              >
                <Text style={styles.confirmButtonText}>Proceed to Upload</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Upload Screenshot Modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Payment Proof</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              style={styles.modalContent}
              data={[{ key: 'upload' }]}
              renderItem={() => (
                <>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>
                      {selectedImage ? 'Change Screenshot' : 'Upload Screenshot'}
                    </Text>
                  </TouchableOpacity>

                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Transaction ID (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter transaction ID"
                      value={transactionId}
                      onChangeText={setTransactionId}
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Remarks (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Add any additional notes"
                      value={remarks}
                      onChangeText={setRemarks}
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmButton, (submitting || !selectedImage) && styles.disabledButton]}
                    onPress={handleSubmitPayment}
                    disabled={submitting || !selectedImage}
                  >
                    {submitting ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.confirmButtonText}>Submit Payment Proof</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  // ✅ NEW: Notification badge styles
  notificationBadge: {
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  // ✅ NEW: Update banner styles
  updateBanner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  updateBannerText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
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
  dropdown: {
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
  },
  dropdownContainer: {
    borderColor: Colors.border,
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.text,
  },
  balanceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  balanceStatus: {
    flexDirection: 'row',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  submittedText: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
  },
  payButton: {
    backgroundColor: Colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  payButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  historyStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyStatusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  paymentModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  bankDetailsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bankDetailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankDetailLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  bankDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentDetailLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  modalNote: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  disabledButton: {
    opacity: 0.6,
  },
});