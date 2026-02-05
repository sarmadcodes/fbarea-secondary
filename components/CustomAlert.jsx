// components/CustomAlert.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const CustomAlert = ({ visible, onClose, title, message, buttons = [], type = 'info' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: Colors.success };
      case 'error':
        return { name: 'close-circle', color: Colors.error };
      case 'warning':
        return { name: 'warning', color: '#FF9800' };
      default:
        return { name: 'information-circle', color: Colors.secondary };
    }
  };

  const icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={icon.name} size={48} color={icon.color} />
          </View>

          {/* Title */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.length > 0 ? (
              buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.buttonCancel,
                    button.style === 'destructive' && styles.buttonDestructive,
                    buttons.length === 1 && styles.buttonSingle,
                  ]}
                  onPress={() => {
                    onClose();
                    button.onPress && button.onPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.buttonTextCancel,
                      button.style === 'destructive' && styles.buttonTextDestructive,
                      buttons.length === 1 && styles.buttonTextSingle,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.buttonSingle]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, styles.buttonTextSingle]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  buttonSingle: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  buttonCancel: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  buttonDestructive: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.secondary,
  },
  buttonTextSingle: {
    color: Colors.white,
  },
  buttonTextCancel: {
    color: Colors.textLight,
  },
  buttonTextDestructive: {
    color: Colors.error,
  },
});

// Helper hook to use CustomAlert
export const useCustomAlert = () => {
  const [alert, setAlert] = React.useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const showAlert = (title, message, buttons = [], type = 'info') => {
    setAlert({
      visible: true,
      title,
      message,
      buttons,
      type,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alert.visible}
      onClose={hideAlert}
      title={alert.title}
      message={alert.message}
      buttons={alert.buttons}
      type={alert.type}
    />
  );

  return { showAlert, AlertComponent };
};

export default CustomAlert;