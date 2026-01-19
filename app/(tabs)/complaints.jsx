import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DropDownPicker from 'react-native-dropdown-picker';
import Colors from '../../constants/Colors';

export default function Complaints() {
  const router = useRouter();
  const [complaintType, setComplaintType] = useState(null);
  const [priority, setPriority] = useState(null);
  const [complaint, setComplaint] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const [complaintTypes, setComplaintTypes] = useState([
    { label: 'Water Supply Issue', value: 'water' },
    { label: 'Electricity Supply Issue', value: 'electricity' },
    { label: 'Sanitation Issue', value: 'sanitation' },
    { label: 'Security Concern', value: 'security' },
    { label: 'Maintenance Issue', value: 'maintenance' },
    { label: 'Noise Complaint', value: 'noise' },
    { label: 'Other', value: 'other' },
  ]);

  const [priorities, setPriorities] = useState([
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
  ]);

  const residentData = {
    name: 'Muhammad Ahmed',
    cnic: '42101-1234567-1',
  };

  const handleSubmit = () => {
    if (!complaintType || !priority || !complaint.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    Alert.alert('Success', 'Your complaint has been submitted successfully!', [
      {
        text: 'OK',
        onPress: () => {
          setComplaintType(null);
          setPriority(null);
          setComplaint('');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.homeButton}>
          <Ionicons name="home-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Complaint</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        nestedScrollEnabled={true}
      >
        {/* Resident Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{residentData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoLabel}>CNIC:</Text>
            <Text style={styles.infoValue}>{residentData.cnic}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[styles.inputGroup, { zIndex: 2000 }]}>
            <Text style={styles.label}>Complaint Type *</Text>
            <DropDownPicker
              open={typeOpen}
              value={complaintType}
              items={complaintTypes}
              setOpen={setTypeOpen}
              setValue={setComplaintType}
              setItems={setComplaintTypes}
              placeholder="Select complaint type"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              listMode="SCROLLVIEW"
            />
          </View>

          <View style={[styles.inputGroup, { zIndex: 1000 }]}>
            <Text style={styles.label}>Priority Level *</Text>
            <DropDownPicker
              open={priorityOpen}
              value={priority}
              items={priorities}
              setOpen={setPriorityOpen}
              setValue={setPriority}
              setItems={setPriorities}
              placeholder="Select priority"
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownContainer}
              textStyle={styles.dropdownText}
              listMode="SCROLLVIEW"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complaint Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your complaint in detail..."
              placeholderTextColor={Colors.textLight}
              value={complaint}
              onChangeText={setComplaint}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Ionicons name="send-outline" size={20} color={Colors.white} />
            <Text style={styles.submitButtonText}>Submit Complaint</Text>
          </TouchableOpacity>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
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
              You will receive updates on your complaint status
            </Text>
          </View>
          <View style={styles.guidelineItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
            <Text style={styles.guidelineText}>
              Misuse of the complaint system may result in penalties
            </Text>
          </View>
        </View>

        {/* Recent Complaints */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <View style={styles.complaintCard}>
            <View style={styles.complaintHeader}>
              <Text style={styles.complaintTitle}>Water Supply Issue</Text>
              <View style={[styles.statusBadge, { backgroundColor: Colors.warning }]}>
                <Text style={styles.statusText}>PENDING</Text>
              </View>
            </View>
            <Text style={styles.complaintText}>
              Water pressure is very low in the morning hours
            </Text>
            <Text style={styles.complaintDate}>Submitted: 2 days ago</Text>
          </View>

          <View style={styles.complaintCard}>
            <View style={styles.complaintHeader}>
              <Text style={styles.complaintTitle}>Street Light Not Working</Text>
              <View style={[styles.statusBadge, { backgroundColor: Colors.success }]}>
                <Text style={styles.statusText}>RESOLVED</Text>
              </View>
            </View>
            <Text style={styles.complaintText}>
              Street light near house A-123 not working
            </Text>
            <Text style={styles.complaintDate}>Submitted: 1 week ago</Text>
          </View>
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
  homeButton: {
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
  },
  dropdownContainer: {
    borderColor: Colors.border,
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
  recentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  complaintCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  complaintText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  complaintDate: {
    fontSize: 12,
    color: Colors.textLight,
  },
});