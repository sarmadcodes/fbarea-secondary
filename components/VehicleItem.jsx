import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function VehicleItem({ 
  vehicle, 
  index, 
  onEdit, 
  onDelete, 
  showActions = true 
}) {
  const getVehicleIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'car':
        return 'car-outline';
      case 'bike':
      case 'motorcycle':
        return 'bicycle-outline';
      case 'truck':
        return 'bus-outline';
      default:
        return 'car-outline';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getVehicleIcon(vehicle.type)} 
            size={28} 
            color={Colors.secondary} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {vehicle.type || 'Vehicle'} {index ? `#${index}` : ''}
          </Text>
          <Text style={styles.plateNumber}>{vehicle.plateNumber || 'N/A'}</Text>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(vehicle)} style={styles.actionButton}>
                <Ionicons name="create-outline" size={20} color={Colors.secondary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={() => onDelete(vehicle)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Make</Text>
            <Text style={styles.detailValue}>{vehicle.make || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Model</Text>
            <Text style={styles.detailValue}>{vehicle.model || '-'}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Color</Text>
            <View style={styles.colorContainer}>
              {vehicle.color && (
                <View 
                  style={[
                    styles.colorDot, 
                    { backgroundColor: vehicle.color.toLowerCase() }
                  ]} 
                />
              )}
              <Text style={styles.detailValue}>{vehicle.color || '-'}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
});