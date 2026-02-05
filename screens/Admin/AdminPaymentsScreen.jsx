// screens/Admin/AdminPaymentsScreen.jsx - FULLY RESPONSIVE VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../../constants/Colors';
import adminPaymentService from '../../services/adminPaymentService';
import { useCustomAlert } from '../../components/CustomAlert';
import { useAdminAuth } from '../../context/AdminAuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const { logoutAdmin, admin } = useAdminAuth();

  // State
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusItems] = useState([
    { label: 'All Payments', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ]);

  // Month filter
  const [monthFilter, setMonthFilter] = useState('all');
  const [monthOpen, setMonthOpen] = useState(false);
  const [monthItems] = useState([
    { label: 'All Months', value: 'all' },
    { label: 'January', value: '1' },
    { label: 'February', value: '2' },
    { label: 'March', value: '3' },
    { label: 'April', value: '4' },
    { label: 'May', value: '5' },
    { label: 'June', value: '6' },
    { label: 'July', value: '7' },
    { label: 'August', value: '8' },
    { label: 'September', value: '9' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' },
  ]);

  // Year filter
  const [yearFilter, setYearFilter] = useState('all');
  const [yearOpen, setYearOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [yearItems] = useState([
    { label: 'All Years', value: 'all' },
    { label: `${currentYear}`, value: `${currentYear}` },
    { label: `${currentYear - 1}`, value: `${currentYear - 1}` },
    { label: `${currentYear - 2}`, value: `${currentYear - 2}` },
    { label: `${currentYear - 3}`, value: `${currentYear - 3}` },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchQuery, statusFilter, monthFilter, yearFilter]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [paymentsResponse, statsResponse] = await Promise.allSettled([
        adminPaymentService.getAllPayments({}),
        adminPaymentService.getPaymentStats(),
      ]);

      if (paymentsResponse.status === 'fulfilled' && paymentsResponse.value?.data) {
        setPayments(paymentsResponse.value.data);
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value?.data) {
        setStats(statsResponse.value.data);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      showAlert('Error', 'Failed to load payments. Please try again.', [], 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Month filter
    if (monthFilter !== 'all') {
      filtered = filtered.filter(p => p.monthNumber === parseInt(monthFilter));
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(p => {
        const paymentYear = new Date(p.dueDate).getFullYear();
        return paymentYear === parseInt(yearFilter);
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.userId?.fullName?.toLowerCase().includes(query) ||
        p.userId?.houseNumber?.toLowerCase().includes(query) ||
        p.userId?.cnicNumber?.includes(query) ||
        p.monthDisplay?.toLowerCase().includes(query) ||
        p.transactionId?.toLowerCase().includes(query)
      );
    }

    setFilteredPayments(filtered);
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, []);

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout from admin panel?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            console.log('[ADMIN_PAYMENTS] 🚪 Logging out...');
            await logoutAdmin();
          },
          style: 'destructive',
        },
      ],
      'warning'
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4CAF50';
      case 'submitted':
        return '#2196F3';
      case 'pending':
        return '#FFA726';
      case 'rejected':
        return '#EF5350';
      default:
        return '#689F71';
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

  const renderPaymentCard = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() => router.push(`/(admin)/payment-detail?id=${item._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
            {item.userId?.fullName || 'N/A'}
          </Text>
          <Text style={styles.houseNumber}>House: {item.userId?.houseNumber || 'N/A'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color="#FFFFFF" />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#689F71" />
          <Text style={styles.infoText} numberOfLines={1}>{item.monthDisplay}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#689F71" />
          <Text style={styles.infoText}>Rs. {item.amount?.toLocaleString()}</Text>
        </View>

        {item.transactionId && (
          <View style={styles.infoRow}>
            <Ionicons name="receipt-outline" size={16} color="#689F71" />
            <Text style={styles.infoTextSmall} numberOfLines={1} ellipsizeMode="middle">
              TXN: {item.transactionId}
            </Text>
          </View>
        )}

        {item.submittedAt && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#689F71" />
            <Text style={styles.infoTextSmall}>
              {new Date(item.submittedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cnicText} numberOfLines={1}>
          CNIC: {item.userId?.cnicNumber || 'N/A'}
        </Text>
        <Ionicons name="chevron-forward" size={18} color="#689F71" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <AlertComponent />

      {/* Top Bar - Responsive */}
      <LinearGradient colors={['#2E7D32', '#66BB6A']} style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View style={styles.topBarLeft}>
            <Text style={styles.topBarTitle}>Admin Panel</Text>
            <Text style={styles.topBarSubtitle}>Payment Management</Text>
            {admin && (
              <Text style={styles.adminName} numberOfLines={1}>
                Welcome, {admin.username}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Fixed Header Section - OUTSIDE FlatList */}
      <View style={styles.fixedHeaderSection}>
        {/* Stats Overview - Responsive Grid */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.overview?.total || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FFA726' }]}>
                {stats.overview?.submitted || 0}
              </Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {stats.overview?.approved || 0}
              </Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#EF5350' }]}>
                {stats.overview?.rejected || 0}
              </Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#689F71" />
          <TextInput
            style={styles.searchInput}
            placeholder={isSmallDevice ? "Search..." : "Search by name, house, CNIC..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#689F71"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#689F71" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters - Stacked Dropdowns for Mobile */}
        <View style={styles.filtersContainer}>
          {/* Status Filter - Full Width */}
          <View style={[styles.filterDropdown, { zIndex: statusOpen ? 5000 : 1 }]}>
            <DropDownPicker
              open={statusOpen}
              value={statusFilter}
              items={statusItems}
              setOpen={(open) => {
                setStatusOpen(open);
                if (open) {
                  setMonthOpen(false);
                  setYearOpen(false);
                }
              }}
              setValue={setStatusFilter}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              placeholder="Status Filter"
              zIndex={5000}
              zIndexInverse={1000}
              listMode="SCROLLVIEW"
              scrollViewProps={{
                nestedScrollEnabled: true,
              }}
            />
          </View>

          {/* Month and Year Filters - Side by Side */}
          <View style={styles.filterRow}>
            <View style={[styles.filterDropdownHalf, { zIndex: monthOpen ? 4000 : 1 }]}>
              <DropDownPicker
                open={monthOpen}
                value={monthFilter}
                items={monthItems}
                setOpen={(open) => {
                  setMonthOpen(open);
                  if (open) {
                    setStatusOpen(false);
                    setYearOpen(false);
                  }
                }}
                setValue={setMonthFilter}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                placeholder="Month"
                zIndex={4000}
                zIndexInverse={2000}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
              />
            </View>

            <View style={[styles.filterDropdownHalf, { zIndex: yearOpen ? 3000 : 1 }]}>
              <DropDownPicker
                open={yearOpen}
                value={yearFilter}
                items={yearItems}
                setOpen={(open) => {
                  setYearOpen(open);
                  if (open) {
                    setStatusOpen(false);
                    setMonthOpen(false);
                  }
                }}
                setValue={setYearFilter}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                textStyle={styles.dropdownText}
                placeholder="Year"
                zIndex={3000}
                zIndexInverse={3000}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
              />
            </View>
          </View>
        </View>

        {/* Results Count */}
        {(statusFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all' || searchQuery) && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              Showing {filteredPayments.length} result{filteredPayments.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      {/* Payments List */}
      <FlatList
        data={filteredPayments}
        renderItem={renderPaymentCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={isSmallDevice ? 48 : 64} color="#689F71" />
            <Text style={styles.emptyText}>No payments found</Text>
            <Text style={styles.emptySubtext}>
              {statusFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all' || searchQuery
                ? 'Try adjusting your filters'
                : 'Payments will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F8F4',
  },
  loadingText: {
    marginTop: 12,
    fontSize: isSmallDevice ? 14 : 16,
    color: '#689F71',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
    paddingHorizontal: isSmallDevice ? 12 : 16,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLeft: {
    flex: 1,
    paddingRight: 8,
  },
  topBarTitle: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topBarSubtitle: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  adminName: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fixedHeaderSection: {
    backgroundColor: '#F1F8F4',
    paddingHorizontal: isSmallDevice ? 10 : 16,
    paddingTop: 16,
    paddingBottom: 16,
    zIndex: 1000,
    elevation: 5,
    marginBottom: 8,
  },
  listContent: {
    padding: isSmallDevice ? 10 : 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: isSmallDevice ? 6 : 8,
  },
  statCard: {
    width: isSmallDevice ? '48%' : '23%',
    minWidth: isSmallDevice ? 150 : 'auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: isSmallDevice ? 10 : 14,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: isSmallDevice ? 18 : 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: isSmallDevice ? 10 : 12,
    color: '#689F71',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: isSmallDevice ? 10 : 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    height: isSmallDevice ? 42 : 48,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: isSmallDevice ? 13 : 15,
    color: '#1B5E20',
  },
  filtersContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  filterDropdown: {
    width: '100%',
  },
  filterDropdownHalf: {
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A5D6A7',
    borderRadius: 10,
    minHeight: isSmallDevice ? 42 : 48,
  },
  dropdownContainer: {
    borderColor: '#A5D6A7',
    borderRadius: 10,
    maxHeight: 300,
    backgroundColor: '#FFFFFF',
    elevation: 5000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1B5E20',
  },
  resultsContainer: {
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#689F71',
    fontStyle: 'italic',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: isSmallDevice ? 12 : 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 8,
  },
  userName: {
    fontSize: isSmallDevice ? 15 : 17,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 4,
  },
  houseNumber: {
    fontSize: isSmallDevice ? 12 : 13,
    color: '#689F71',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallDevice ? 8 : 10,
    paddingVertical: isSmallDevice ? 4 : 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: isSmallDevice ? 9 : 10,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E8F5E9',
    marginBottom: 10,
  },
  cardBody: {
    gap: 8,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: '#1B5E20',
    fontWeight: '600',
    flex: 1,
  },
  infoTextSmall: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#689F71',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  cnicText: {
    fontSize: isSmallDevice ? 11 : 12,
    color: '#689F71',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: isSmallDevice ? 40 : 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
    color: '#689F71',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: isSmallDevice ? 12 : 14,
    color: '#689F71',
    marginTop: 8,
    textAlign: 'center',
  },
});