// screens/Admin/AdminPaymentDetailScreen.jsx - FULLY RESPONSIVE VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  Linking,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import adminPaymentService from '../../services/adminPaymentService';
import { useCustomAlert } from '../../components/CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;

export default function AdminPaymentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showAlert, AlertComponent } = useCustomAlert();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Reject modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

  useEffect(() => {
    if (id) {
      loadPayment();
    }
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const response = await adminPaymentService.getPaymentById(id);
      
      if (response.success && response.data) {
        setPayment(response.data);
      } else {
        showAlert('Error', 'Payment not found', [
          { text: 'Go Back', onPress: () => router.back() },
        ], 'error');
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      showAlert('Error', 'Failed to load payment details', [
        { text: 'Retry', onPress: loadPayment },
        { text: 'Go Back', onPress: () => router.back() },
      ], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    Alert.alert(
      'Approve Payment',
      'Are you sure you want to approve this payment? This will activate the user\'s digital card.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: confirmApprove,
        },
      ]
    );
  };

  const confirmApprove = async () => {
    try {
      setProcessing(true);
      
      const response = await adminPaymentService.approvePayment(payment._id, adminNotes);
      
      if (response.success) {
        showAlert('Success', 'Payment approved successfully! Digital card has been activated.', [
          { text: 'OK', onPress: () => router.back() },
        ], 'success');
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve payment';
      showAlert('Error', errorMessage, [], 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim()) {
      showAlert('Required', 'Please provide a rejection reason', [], 'error');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      showAlert('Invalid', 'Rejection reason must be at least 10 characters', [], 'error');
      return;
    }

    try {
      setProcessing(true);
      setRejectModalVisible(false);
      
      const response = await adminPaymentService.rejectPayment(
        payment._id,
        rejectionReason,
        adminNotes
      );
      
      if (response.success) {
        showAlert('Success', 'Payment rejected successfully', [
          { text: 'OK', onPress: () => router.back() },
        ], 'success');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject payment';
      showAlert('Error', errorMessage, [], 'error');
    } finally {
      setProcessing(false);
      setRejectionReason('');
      setAdminNotes('');
    }
  };

  const downloadScreenshot = () => {
    if (payment?.paymentProof?.url) {
      Linking.openURL(payment.paymentProof.url).catch(err => {
        console.error('Failed to open URL:', err);
        showAlert('Error', 'Failed to open payment screenshot', [], 'error');
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return Colors.success;
      case 'submitted':
        return Colors.info;
      case 'pending':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.textLight;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'submitted':
        return 'time';
      case 'pending':
        return 'alert-circle';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={isSmallDevice ? 48 : 64} color={Colors.error} />
        <Text style={styles.errorText}>Payment not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AlertComponent />

      {/* Top Bar - Responsive */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.topBar}>
        <View style={styles.topBarContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
            <Ionicons name="arrow-back" size={isSmallDevice ? 22 : 24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>Payment Details</Text>
            <Text style={styles.topBarSubtitle} numberOfLines={1}>{payment.monthDisplay}</Text>
          </View>
          <View style={{ width: isSmallDevice ? 30 : 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
            <Ionicons name={getStatusIcon(payment.status)} size={isSmallDevice ? 20 : 24} color={Colors.white} />
            <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* User Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue} numberOfLines={2}>{payment.userId?.fullName || 'N/A'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNIC:</Text>
              <Text style={styles.infoValue}>{payment.userId?.cnicNumber || 'N/A'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>House:</Text>
              <Text style={styles.infoValue}>{payment.userId?.houseNumber || 'N/A'}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{payment.userId?.phoneNumber || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Month:</Text>
              <Text style={styles.infoValue}>{payment.monthDisplay}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount:</Text>
              <Text style={[styles.infoValue, styles.amountText]}>
                Rs. {payment.amount?.toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(payment.dueDate).toLocaleDateString()}
              </Text>
            </View>
            
            {payment.transactionId && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transaction ID:</Text>
                  <Text style={styles.infoValue} numberOfLines={2}>{payment.transactionId}</Text>
                </View>
              </>
            )}

            {payment.submittedAt && (
              <>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Submitted At:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(payment.submittedAt).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment Remarks */}
        {payment.paymentRemarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Remarks</Text>
            <View style={styles.card}>
              <Text style={styles.remarksText}>{payment.paymentRemarks}</Text>
            </View>
          </View>
        )}

        {/* Payment Screenshot */}
        {payment.paymentProof?.url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Screenshot</Text>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setImageViewerVisible(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: payment.paymentProof.url }}
                style={styles.paymentImage}
                resizeMode="contain"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={18} color={Colors.white} />
                <Text style={styles.imageOverlayText}>Tap to view full size</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={downloadScreenshot}
              activeOpacity={0.7}
            >
              <Ionicons name="download-outline" size={18} color={Colors.primary} />
              <Text style={styles.downloadButtonText}>Open Original</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admin Notes */}
        {(payment.status === 'submitted' || payment.status === 'pending') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Notes (Optional)</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this payment..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
        )}

        {/* Rejection Reason (if rejected) */}
        {payment.status === 'rejected' && payment.rejectionReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rejection Reason</Text>
            <View style={styles.card}>
              <Text style={styles.remarksText}>{payment.rejectionReason}</Text>
              {payment.rejectedAt && (
                <>
                  <View style={[styles.infoDivider, { marginVertical: 12 }]} />
                  <Text style={styles.infoTextSmall}>
                    Rejected on: {new Date(payment.rejectedAt).toLocaleString()}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* Admin Info (if approved/rejected) */}
        {(payment.status === 'approved' || payment.status === 'rejected') && payment.adminNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Notes</Text>
            <View style={styles.card}>
              <Text style={styles.remarksText}>{payment.adminNotes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {(payment.status === 'submitted' || payment.status === 'pending') && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={handleApprove}
              disabled={processing}
              activeOpacity={0.7}
            >
              {processing ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                  <Text style={styles.actionButtonText}>Approve Payment</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleReject}
              disabled={processing}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={Colors.white} />
              <Text style={styles.actionButtonText}>Reject Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Approved Banner */}
        {payment.status === 'approved' && (
          <View style={styles.approvedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.approvedBannerText}>Payment Approved</Text>
          </View>
        )}

        {/* Rejected Banner */}
        {payment.status === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
            <Text style={styles.rejectedBannerText}>Payment Rejected</Text>
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Payment</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
              <Text style={styles.modalLabel}>Rejection Reason *</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Provide a detailed reason for rejection (minimum 10 characters)"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={[styles.modalLabel, { marginTop: 16 }]}>Admin Notes (Optional)</Text>
              <TextInput
                style={styles.modalTextArea}
                placeholder="Add any additional notes..."
                value={adminNotes}
                onChangeText={setAdminNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor={Colors.textLight}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={confirmReject}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close-circle" size={36} color={Colors.white} />
          </TouchableOpacity>
          <Image
            source={{ uri: payment?.paymentProof?.url }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: isSmallDevice ? 14 : 16,
    color: Colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  errorText: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: isSmallDevice ? 20 : 24,
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: isSmallDevice ? 12 : 16,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIconButton: {
    padding: 4,
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  topBarTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  topBarSubtitle: {
    fontSize: isSmallDevice ? 12 : 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: isSmallDevice ? 12 : 16,
    paddingBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: isSmallDevice ? 16 : 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 16 : 20,
    paddingVertical: isSmallDevice ? 10 : 12,
    borderRadius: 20,
    gap: 8,
  },
  statusText: {
    color: Colors.white,
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: isSmallDevice ? 16 : 20,
  },
  sectionTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: isSmallDevice ? 8 : 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: isSmallDevice ? 6 : 8,
    gap: 8,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  infoLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    color: Colors.textLight,
    fontWeight: '600',
    width: isSmallDevice ? 80 : 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: isSmallDevice ? 13 : 14,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  amountText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  remarksText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: Colors.text,
    lineHeight: isSmallDevice ? 18 : 20,
  },
  notesInput: {
    fontSize: isSmallDevice ? 13 : 14,
    color: Colors.text,
    minHeight: isSmallDevice ? 70 : 80,
    textAlignVertical: 'top',
  },
  infoTextSmall: {
    fontSize: isSmallDevice ? 11 : 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  imageContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentImage: {
    width: '100%',
    height: isSmallDevice ? 200 : 250,
    backgroundColor: Colors.background,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: isSmallDevice ? 8 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageOverlayText: {
    color: Colors.white,
    fontSize: isSmallDevice ? 12 : 14,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    marginTop: 12,
    gap: 8,
  },
  downloadButtonText: {
    color: Colors.primary,
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 8,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: 'bold',
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successLight,
    padding: isSmallDevice ? 16 : 20,
    borderRadius: 12,
    gap: 12,
  },
  approvedBannerText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: Colors.success,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    padding: isSmallDevice ? 16 : 20,
    borderRadius: 12,
    gap: 12,
  },
  rejectedBannerText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: Colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isSmallDevice ? 16 : 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalBody: {
    padding: isSmallDevice ? 16 : 20,
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  modalLabel: {
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalTextArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: isSmallDevice ? 10 : 12,
    fontSize: isSmallDevice ? 14 : 15,
    color: Colors.text,
    minHeight: isSmallDevice ? 80 : 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: isSmallDevice ? 16 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: isSmallDevice ? 14 : 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: '600',
    color: Colors.text,
  },
  modalConfirmButton: {
    backgroundColor: Colors.error,
  },
  modalConfirmText: {
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 20,
    right: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
});