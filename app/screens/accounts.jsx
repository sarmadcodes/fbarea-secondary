import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../../constants/Colors';

export default function Accounts() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState('january-2025');
  const [open, setOpen] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  
  const [months, setMonths] = useState([
    { label: 'January 2025', value: 'january-2025' },
    { label: 'December 2024', value: 'december-2024' },
    { label: 'November 2024', value: 'november-2024' },
    { label: 'October 2024', value: 'october-2024' },
  ]);

  const paymentHistory = [
    { month: 'January 2025', amount: 5000, status: 'pending', date: '-' },
    { month: 'December 2024', amount: 5000, status: 'paid', date: '05 Dec 2024' },
    { month: 'November 2024', amount: 5000, status: 'paid', date: '03 Nov 2024' },
    { month: 'October 2024', amount: 5000, status: 'paid', date: '01 Oct 2024' },
  ];

  const handlePayment = () => {
    setPaymentModalVisible(false);
    Alert.alert('Success', 'Payment of Rs. 5,000 processed successfully!');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView style={styles.content}>
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

        {/* Current Balance Card */}
        <View style={styles.section}>
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#FF512F', '#DD2476']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceLabel}>Monthly Maintenance</Text>
              <Text style={styles.balanceAmount}>Rs. 5,000</Text>
              <View style={styles.balanceStatus}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setPaymentModalVisible(true)}
          >
            <Ionicons name="card-outline" size={24} color={Colors.white} />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {paymentHistory.map((payment, index) => (
            <View key={index} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View
                  style={[
                    styles.historyIcon,
                    payment.status === 'paid'
                      ? { backgroundColor: '#E8F5E9' }
                      : { backgroundColor: '#FFEBEE' },
                  ]}
                >
                  <Ionicons
                    name={payment.status === 'paid' ? 'checkmark-circle' : 'time-outline'}
                    size={24}
                    color={payment.status === 'paid' ? Colors.success : Colors.error}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyMonth}>{payment.month}</Text>
                  <Text style={styles.historyDate}>{payment.date}</Text>
                </View>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>Rs. {payment.amount.toLocaleString()}</Text>
                <View
                  style={[
                    styles.historyStatus,
                    payment.status === 'paid'
                      ? { backgroundColor: Colors.success }
                      : { backgroundColor: Colors.error },
                  ]}
                >
                  <Text style={styles.historyStatusText}>
                    {payment.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Paid (2024)</Text>
              <Text style={styles.summaryValue}>Rs. 60,000</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Amount</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>Rs. 5,000</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Payment Modal */}
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
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentDetailLabel}>Amount</Text>
                <Text style={styles.paymentDetailValue}>Rs. 5,000</Text>
              </View>
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentDetailLabel}>Month</Text>
                <Text style={styles.paymentDetailValue}>January 2025</Text>
              </View>
              <View style={styles.paymentDetail}>
                <Text style={styles.paymentDetailLabel}>Payment Method</Text>
                <Text style={styles.paymentDetailValue}>Online Banking</Text>
              </View>

              <Text style={styles.modalNote}>
                You will be redirected to payment gateway to complete the transaction.
              </Text>

              <TouchableOpacity style={styles.confirmButton} onPress={handlePayment}>
                <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
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
});