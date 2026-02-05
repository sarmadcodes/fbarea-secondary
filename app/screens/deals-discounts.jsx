// app/(tabs)/deals-discounts.jsx - FIXED VERSION with proper data rendering
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  FlatList,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useCustomAlert } from '../../components/CustomAlert';
import dealsService from '../../services/dealsService';

export default function DealsDiscounts() {
  const router = useRouter();
  const { showAlert, AlertComponent } = useCustomAlert();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [categories, setCategories] = useState([]);
  const [deals, setDeals] = useState([]);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadDeals();
    }
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('[DEALS_SCREEN] 🔄 Loading data...');
      
      // Load categories
      const categoriesRes = await dealsService.getCategories();
      console.log('[DEALS_SCREEN] 📦 Categories response:', categoriesRes);
      
      // ✅ FIX: The response IS the array directly from dealsService
      let categoryData = [];
      if (Array.isArray(categoriesRes)) {
        categoryData = categoriesRes;
      } else if (categoriesRes?.data && Array.isArray(categoriesRes.data)) {
        categoryData = categoriesRes.data;
      }
      
      const allCategories = [
        { _id: 'all', name: 'All', icon: 'grid-outline', isActive: true },
        ...categoryData,
      ];
      
      console.log('[DEALS_SCREEN] 📂 Total categories:', allCategories.length);
      console.log('[DEALS_SCREEN] 📋 Categories array:', JSON.stringify(allCategories, null, 2));
      
      // ✅ FIX: Don't filter by isActive - backend doesn't return this field
      // Only the "All" category has it, so filtering removes all backend categories!
      setCategories(allCategories);
      
      // Load deals
      await loadDeals();
      
    } catch (error) {
      console.error('[DEALS_SCREEN] ❌ Load data error:', error);
      showAlert('Error', error.message || 'Failed to load deals. Please try again.', [], 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    try {
      console.log('[DEALS_SCREEN] 🔄 Loading deals for category:', selectedCategory);
      
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      
      const dealsRes = await dealsService.getDeals(params);
      console.log('[DEALS_SCREEN] 📦 Deals response:', dealsRes);
      
      // ✅ FIX: The response IS the array directly from dealsService
      let dealsData = [];
      if (Array.isArray(dealsRes)) {
        dealsData = dealsRes;
      } else if (dealsRes?.data && Array.isArray(dealsRes.data)) {
        dealsData = dealsRes.data;
      }
      
      console.log('[DEALS_SCREEN] 🎯 Total deals found:', dealsData.length);
      setDeals(dealsData);
      
    } catch (error) {
      console.error('[DEALS_SCREEN] ❌ Load deals error:', error);
      showAlert('Error', 'Failed to load deals', [], 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDealPress = async (deal) => {
    try {
      console.log('[DEALS_SCREEN] 📱 Deal pressed:', deal.name);
      setSelectedDeal(deal);
      setModalVisible(true);
      
      // Load coupons for this deal
      const couponsRes = await dealsService.getCouponsByDeal(deal._id);
      console.log('[DEALS_SCREEN] 🎟️ Coupons response:', couponsRes);
      
      // ✅ FIX: The response IS the array directly from dealsService
      let couponsData = [];
      if (Array.isArray(couponsRes)) {
        couponsData = couponsRes;
      } else if (couponsRes?.data && Array.isArray(couponsRes.data)) {
        couponsData = couponsRes.data;
      }
      
      console.log('[DEALS_SCREEN] 🎫 Total coupons:', couponsData.length);
      setCoupons(couponsData);
      
    } catch (error) {
      console.error('[DEALS_SCREEN] ❌ Load coupons error:', error);
      showAlert('Error', 'Failed to load coupons', [], 'error');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDeal(null);
    setCoupons([]);
  };

  const handleCopyCoupon = (code) => {
    Clipboard.setString(code);
    showAlert('Success', `Coupon code "${code}" copied!`, [], 'success');
  };

  const handleBack = () => {
    router.back();
  };

  const renderCategoryItem = (category) => (
    <TouchableOpacity
      key={category._id}
      style={[
        styles.categoryPill,
        selectedCategory === category._id && styles.selectedCategoryPill,
      ]}
      onPress={() => setSelectedCategory(category._id)}
    >
      <Ionicons 
        name={category.icon} 
        size={16} 
        color={selectedCategory === category._id ? Colors.white : '#666666'} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === category._id && styles.selectedCategoryText,
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderDealCard = ({ item: deal }) => (
    <TouchableOpacity
      style={styles.dealCard}
      onPress={() => handleDealPress(deal)}
      activeOpacity={0.8}
    >
      {/* Deal Image - Full Width Top */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: deal.image }} 
          style={styles.dealImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
          style={styles.imageGradient}
        />
        {deal.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{deal.discount}</Text>
          </View>
        )}
        {deal.couponCount > 0 && (
          <View style={styles.couponBadge}>
            <Ionicons name="pricetag" size={14} color={Colors.white} />
            <Text style={styles.couponBadgeText}>{deal.couponCount} Coupon{deal.couponCount > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Deal Info - Bottom */}
      <View style={styles.dealInfo}>
        <Text style={styles.dealName} numberOfLines={1}>{deal.name}</Text>
        <Text style={styles.dealDescription} numberOfLines={2}>
          {deal.description}
        </Text>
        
        {/* Bottom Info Row */}
        <View style={styles.dealFooter}>
          <View style={styles.dealFooterLeft}>
            {deal.address && (
              <View style={styles.dealInfoItem}>
                <Ionicons name="location" size={14} color={Colors.primary} />
                <Text style={styles.dealInfoText} numberOfLines={1}>{deal.address}</Text>
              </View>
            )}
            {deal.phone && (
              <View style={styles.dealInfoItem}>
                <Ionicons name="call" size={14} color={Colors.primary} />
                <Text style={styles.dealInfoText} numberOfLines={1}>{deal.phone}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward-circle" size={28} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCouponModal = () => {
    if (!selectedDeal) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalDealIcon}>
                  <Ionicons name="storefront" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalDealName} numberOfLines={1}>{selectedDeal.name}</Text>
                  <Text style={styles.modalDealDescription} numberOfLines={1}>{selectedDeal.description}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Deal Image */}
            <Image 
              source={{ uri: selectedDeal.image }} 
              style={styles.modalDealImage}
              resizeMode="cover"
            />

            {/* Coupons List */}
            <ScrollView style={styles.couponsContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.couponsTitle}>Available Coupons</Text>
              
              {coupons && coupons.length > 0 ? (
                coupons.map((coupon, index) => {
                  const isExpired = new Date(coupon.validTill) < new Date();
                  const isActive = coupon.isActive && !isExpired;
                  
                  return (
                    <View 
                      key={coupon._id || index} 
                      style={[
                        styles.couponCard,
                        !isActive && styles.couponCardInactive
                      ]}
                    >
                      <View style={styles.couponHeader}>
                        <View style={styles.couponCodeContainer}>
                          <Ionicons name="pricetag" size={20} color={isActive ? Colors.primary : Colors.textLight} />
                          <Text style={[
                            styles.couponCode,
                            !isActive && styles.couponCodeInactive
                          ]}>
                            {coupon.code}
                          </Text>
                        </View>
                        {isActive && (
                          <TouchableOpacity 
                            style={styles.copyButton}
                            onPress={() => handleCopyCoupon(coupon.code)}
                          >
                            <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                            <Text style={styles.copyButtonText}>Copy</Text>
                          </TouchableOpacity>
                        )}
                        {!isActive && (
                          <Text style={styles.expiredLabel}>
                            {isExpired ? 'Expired' : 'Inactive'}
                          </Text>
                        )}
                      </View>
                      
                      <Text style={[
                        styles.couponDescription,
                        !isActive && styles.couponDescriptionInactive
                      ]}>
                        {coupon.description}
                      </Text>
                      
                      <View style={styles.couponFooter}>
                        <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                        <Text style={styles.validTillText}>
                          Valid till: {new Date(coupon.validTill).toLocaleDateString()}
                        </Text>
                      </View>

                      {coupon.discount && (
                        <View style={styles.discountInfo}>
                          <Text style={styles.discountInfoText}>💰 {coupon.discount}</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <View style={styles.noCoupons}>
                  <Ionicons name="pricetags-outline" size={48} color={Colors.textLight} />
                  <Text style={styles.noCouponsText}>No coupons available</Text>
                </View>
              )}

              {/* How to Use Section */}
              {coupons && coupons.length > 0 && (
                <View style={styles.howToUse}>
                  <Text style={styles.howToUseTitle}>📋 How to Use</Text>
                  <View style={styles.howToUseItem}>
                    <Text style={styles.howToUseStep}>1.</Text>
                    <Text style={styles.howToUseText}>Copy the coupon code</Text>
                  </View>
                  <View style={styles.howToUseItem}>
                    <Text style={styles.howToUseStep}>2.</Text>
                    <Text style={styles.howToUseText}>Visit the store/website</Text>
                  </View>
                  <View style={styles.howToUseItem}>
                    <Text style={styles.howToUseStep}>3.</Text>
                    <Text style={styles.howToUseText}>Apply the code at checkout</Text>
                  </View>
                </View>
              )}

              {/* Contact Info */}
              {(selectedDeal.phone || selectedDeal.address) && (
                <View style={styles.contactInfo}>
                  {selectedDeal.phone && (
                    <View style={styles.contactItem}>
                      <Ionicons name="call-outline" size={18} color={Colors.primary} />
                      <Text style={styles.contactText}>{selectedDeal.phone}</Text>
                    </View>
                  )}
                  {selectedDeal.address && (
                    <View style={styles.contactItem}>
                      <Ionicons name="location-outline" size={18} color={Colors.primary} />
                      <Text style={styles.contactText}>{selectedDeal.address}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header with gradient - Similar to Guest Requests */}
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deals & Discounts</Text>
          <View style={styles.backButton} />
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => renderCategoryItem(category))}
        </ScrollView>
      </View>

      {/* Deals List */}
      <FlatList
        data={deals}
        renderItem={renderDealCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.dealsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="pricetags-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>No Deals Available</Text>
            <Text style={styles.emptyStateSubtext}>
              {selectedCategory === 'all' 
                ? 'Check back later for exciting deals!'
                : 'Try selecting a different category'
              }
            </Text>
          </View>
        }
      />

      {/* Coupon Modal */}
      {renderCouponModal()}

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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textLight,
  },

  // Header - Similar to Guest Requests
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
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

  // Categories - Compact horizontal design
  categoriesWrapper: {
    backgroundColor: '#FFFFFF', // ✅ Explicit white background
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5', // ✅ Explicit border color
    minHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F5F5', // ✅ Explicit light gray
    borderWidth: 1.5,
    borderColor: '#D1D1D1', // ✅ Explicit gray border
    marginRight: 8,
  },
  selectedCategoryPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333', // ✅ Explicit dark text
  },
  selectedCategoryText: {
    color: Colors.white,
    fontWeight: '600',
  },

  // Deals List - Large Vertical Cards
  dealsContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  dealCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  discountText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  couponBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  couponBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  dealInfo: {
    padding: 12,
  },
  dealName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 10,
    lineHeight: 18,
  },
  dealFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealFooterLeft: {
    flex: 1,
    gap: 6,
  },
  dealInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealInfoText: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
    fontWeight: '500',
  },
  couponCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  couponCountText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  modalDealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalDealDescription: {
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalDealImage: {
    width: '100%',
    height: 160,
  },
  couponsContainer: {
    padding: 16,
  },
  couponsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  couponCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  couponCardInactive: {
    opacity: 0.5,
    backgroundColor: Colors.backgroundDark,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  couponCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  couponCodeInactive: {
    color: Colors.textLight,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  expiredLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.error,
  },
  couponDescription: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 18,
  },
  couponDescriptionInactive: {
    color: Colors.textLight,
  },
  couponFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  validTillText: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  discountInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  discountInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  noCoupons: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noCouponsText: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.textLight,
  },
  howToUse: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 12,
  },
  howToUseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  howToUseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  howToUseStep: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 6,
    width: 18,
  },
  howToUseText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  contactInfo: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
});