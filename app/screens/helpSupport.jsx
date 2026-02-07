import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '../../constants/Colors';

export default function HelpSupport() {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const toggleFAQ = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqs = [
    {
      category: 'Account & Login',
      icon: 'person-circle-outline',
      questions: [
        {
          question: 'How do I log into my account?',
          answer: 'Use your registered phone number and password to log in. If you forgot your password, use the "Forgot Password" option on the login screen.',
        },
        {
          question: 'How do I change my password?',
          answer: 'Navigate to Profile → Security, then enter your current password and set a new password (minimum 6 characters).',
        },
      ],
    },
    {
      category: 'Payments',
      icon: 'wallet-outline',
      questions: [
        {
          question: 'How do I pay my monthly maintenance fee?',
          answer: 'Go to Accounts tab, select the month you want to pay for, and upload your payment receipt with transaction ID. Payments are reviewed within 24-48 hours.',
        },
      ],
    },
    {
      category: 'Complaints',
      icon: 'warning-outline',
      questions: [
        {
          question: 'How do I file a complaint?',
          answer: 'Go to Complaints tab → Write Complaint. Select complaint type, priority level, and describe your issue (minimum 10 characters). You will receive a complaint number for tracking.',
        },
        {
          question: 'What types of complaints can I submit?',
          answer: 'You can submit complaints about: Water Supply Issues, Electricity Issues, Maintenance Problems, Security Concerns, Noise Complaints, and Other issues.',
        },
        {
          question: 'How do I track my complaint status?',
          answer: 'Go to Complaints tab → Recent Complaints to view all your submitted complaints, their status (Pending, In Progress, Resolved, or Rejected), and admin responses.',
        },
      ],
    },
    {
      category: 'Digital Card',
      icon: 'card-outline',
      questions: [
        {
          question: 'What is a digital card?',
          answer: 'The digital card is your official resident ID card that you can access on your phone. It shows your name, house number, CNIC, and is valid for one year.',
        },
        {
          question: 'How do I get my digital card?',
          answer: 'Your digital card is automatically generated after your account is approved and you have completed all required payments. It will appear in the Digital Card section.',
        },
      ],
    },
    {
      category: 'General App Usage',
      icon: 'help-circle-outline',
      questions: [
        {
          question: 'How do I navigate the app?',
          answer: 'Use the bottom navigation bar to switch between Home, Complaints, and Profile. The Home screen provides quick access to all features.',
        },
        {
          question: 'Is my data secure?',
          answer: 'Yes, all your personal information is encrypted and stored securely. We follow strict privacy policies and never share your data with third parties.',
        },
      ],
    },
  ];

  const handleCall = (phoneNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={[Colors.primary, Colors.secondary]} style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactTitle}>Need Immediate Help?</Text>
          </View>
          <Text style={styles.contactDescription}>
            Contact the society office for urgent matters or assistance
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleCall('+923001234567')}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={20} color={Colors.white} />
              <View style={styles.contactButtonText}>
                <Text style={styles.contactButtonLabel}>Society Office</Text>
                <Text style={styles.contactButtonNumber}>+92 300 1234567</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contactButton, styles.contactButtonSecondary]}
              onPress={() => handleEmail('info@block13rwa.com')}
              activeOpacity={0.7}
            >
              <Ionicons name="mail" size={20} color={Colors.secondary} />
              <View style={styles.contactButtonText}>
                <Text style={[styles.contactButtonLabel, { color: Colors.secondary }]}>Email Us</Text>
                <Text style={[styles.contactButtonNumber, { color: Colors.secondary }]}>info@block13rwa.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.officeHours}>
            <Ionicons name="time-outline" size={18} color={Colors.textLight} />
            <Text style={styles.officeHoursText}>Office Hours: Mon-Sat, 9:00 AM - 5:00 PM</Text>
          </View>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        {faqs.map((category, categoryIndex) => (
          <View key={categoryIndex} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                <Ionicons name={category.icon} size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.categoryTitle}>{category.category}</Text>
            </View>

            {category.questions.map((faq, faqIndex) => {
              const globalIndex = `${categoryIndex}-${faqIndex}`;
              const isExpanded = expandedFAQ === globalIndex;

              return (
                <TouchableOpacity
                  key={globalIndex}
                  style={styles.faqCard}
                  onPress={() => toggleFAQ(globalIndex)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestion}>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={Colors.secondary}
                    />
                  </View>
                  
                  {isExpanded && (
                    <View style={styles.faqAnswer}>
                      <View style={styles.answerIndicator} />
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Still Need Help Card */}
        <View style={styles.stillNeedHelpCard}>
          <Text style={styles.stillNeedHelpTitle}>Still need help?</Text>
          <Text style={styles.stillNeedHelpText}>
            If you could not find the answer you are looking for, please contact our support team. We are here to help!
          </Text>
          <TouchableOpacity 
            style={styles.contactSupportButton}
            onPress={() => handleCall('+923001234567')}
            activeOpacity={0.7}
          >
            <Text style={styles.contactSupportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contactCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  contactTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: Colors.text,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
  contactButtons: {
    gap: 12,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  contactButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  contactButtonText: {
    flex: 1,
  },
  contactButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactButtonNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  officeHours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  officeHoursText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.secondary,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 12,
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  answerIndicator: {
    width: 3,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginTop: 2,
  },
  faqAnswerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 22,
  },
  stillNeedHelpCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  stillNeedHelpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  stillNeedHelpText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactSupportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactSupportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  bottomPadding: {
    height: 40,
  },
});