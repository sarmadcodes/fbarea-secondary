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
  const [imageLoading, setImageLoading] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');

  const [hasNewNotification, setHasNewNotification] = useState(false);
  const notificationUnsubscribeRef = useRef(null);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (notificationUnsubscribeRef.current) {
        notificationUnsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    loadData();
    
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

  const loadData = async (isRefresh = false) => {
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

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

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

      if (monthsResponse.status === 'fulfilled' && monthsResponse.value?.data) {
        const availableMonths = monthsResponse.value.data;
        setMonths(availableMonths);

        if (availableMonths.length > 0 && !selectedMonth) {
          setSelectedMonth(availableMonths[0].value);
        }
      } else {
        console.error('Failed to load months:', monthsResponse.reason);
        setMonths([]);
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        setStats(statsResponse.value.data);
      } else {
        console.error('Failed to load stats:', statsResponse.reason);
        setStats(null);
      }

      if (historyResponse.status === 'fulfilled' && historyResponse.value?.data) {
        setPaymentHistory(historyResponse.value.data);
      } else {
        console.error('Failed to load history:', historyResponse.reason);
        setPaymentHistory([]);
      }

      if (bankResponse.status === 'fulfilled' && bankResponse.value?.data) {
        setBankDetails(bankResponse.value.data);
      } else {
        console.error('Failed to load bank details:', bankResponse.reason);
      }

      const allFailed = [monthsResponse, statsResponse, historyResponse, bankResponse]
        .every(r => r.status === 'rejected');

      if (allFailed) {
        showAlert('Connection Error', 'Failed to load payment data. Please check your internet connection and try again.', [{ text: 'Retry', onPress: () => loadData(false) }], 'error');
      }

    } catch (error) {
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

  const onRefresh = async () => {
    if (loadingRef.current) {
      console.log('⏭️ Skipping duplicate refresh');
      return;
    }

    console.log('🔄 Refreshing payment data...');
    await loadData(true);
    
    if (selectedMonth) {
      await loadPaymentForMonth(selectedMonth);
    }
    
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

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        console.log('🖼️ Image selected:', imageUri);
        
        setImageLoading(true);
        setImageReady(false);
        setSelectedImage(imageUri);

        await validateImage(imageUri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showAlert('Error', 'Failed to select image. Please try again.', [], 'error');
      setSelectedImage(null);
      setImageLoading(false);
      setImageReady(false);
    }
  };

  const validateImage = async (imageUri) => {
    try {
      await new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            console.log('✅ Image validated:', width, 'x', height);
            resolve({ width, height });
          },
          (error) => {
            console.error('❌ Image validation failed:', error);
            reject(error);
          }
        );
      });

      console.log('⏳ Preparing image for upload...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setImageReady(true);
      setImageLoading(false);
      
      console.log('✅ Image ready for upload');
    } catch (error) {
      console.error('❌ Image validation failed:', error);
      showAlert('Error', 'Failed to process image. Please select a different image.', [], 'error');
      
      setSelectedImage(null);
      setImageReady(false);
      setImageLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedImage) {
      showAlert('Error', 'Please upload payment screenshot', [], 'error');
      return;
    }

    if (!imageReady) {
      showAlert('Please Wait', 'Image is still processing. Please wait a moment.', [], 'warning');
      return;
    }

    if (submitting) {
      console.log('⏭️ Already submitting payment...');
      return;
    }

    try {
      setSubmitting(true);
      console.log('📤 Submitting payment proof...');

      await paymentService.submitPaymentProof(
        currentPayment._id,
        selectedImage,
        transactionId,
        remarks
      );

      console.log('✅ Payment proof submitted successfully');

      showAlert('Success', 'Payment proof submitted successfully! Waiting for admin approval.', [{ 
        text: 'OK', 
        onPress: () => {
          setUploadModalVisible(false);
          resetUploadForm();
          loadData(false);
          if (selectedMonth) {
            loadPaymentForMonth(selectedMonth);
          }
        }
      }], 'success');
    } catch (error) {
      console.error('❌ Submit payment failed:', error);
      showAlert('Error', error.message || 'Failed to submit payment proof. Please try again.', [], 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedImage(null);
    setImageReady(false);
    setImageLoading(false);
    setTransactionId('');
    setRemarks('');
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'Not set';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
      
      <AlertComponent />
      
      {/* ✅ FIXED: Properly Aligned Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <View style={styles.headerRight}>
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

      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setUploadModalVisible(false);
          resetUploadForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Payment Proof</Text>
              <TouchableOpacity onPress={() => {
                setUploadModalVisible(false);
                resetUploadForm();
              }}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              style={styles.modalContent}
              data={[{ key: 'upload' }]}
              renderItem={() => (
                <>
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={pickImage}
                    disabled={imageLoading}
                  >
                    <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>
                      {selectedImage ? 'Change Screenshot' : 'Upload Screenshot'}
                    </Text>
                  </TouchableOpacity>

                  {selectedImage && (
                    <View style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.imagePreview} 
                      />
                      
                      {imageLoading && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.imageLoadingText}>Processing image...</Text>
                          <Text style={styles.imageLoadingSubtext}>This ensures reliable upload</Text>
                        </View>
                      )}
                      
                      {imageReady && !imageLoading && (
                        <View style={styles.imageReadyBadge}>
                          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                          <Text style={styles.imageReadyText}>Ready to submit</Text>
                        </View>
                      )}
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
                      editable={!submitting}
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
                      editable={!submitting}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton, 
                      (submitting || !selectedImage || !imageReady) && styles.disabledButton
                    ]}
                    onPress={handleSubmitPayment}
                    disabled={submitting || !selectedImage || !imageReady}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator color={Colors.white} size="small" style={{ marginRight: 8 }} />
                        <Text style={styles.confirmButtonText}>Uploading...</Text>
                      </>
                    ) : (
                      <Text style={styles.confirmButtonText}>
                        {!imageReady && selectedImage ? 'Processing...' : 'Submit Payment Proof'}
                      </Text>
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
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
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
    flexDirection: 'row',
    justifyContent: 'center',
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
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  imageLoadingSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textLight,
  },
  imageReadyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  imageReadyText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
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