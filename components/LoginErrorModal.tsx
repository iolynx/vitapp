import React, { useState } from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';

interface LoginErrorModalProps {
  message: String;
  visible: boolean;
  onClose: () => void;
}

const LoginErrorModal: React.FC<LoginErrorModalProps> = ({ message, visible, onClose }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose} // Handles back button press on Android
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.message}>{message}</Text>
          <Button title="OK" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dimmed background
  },
  modalContainer: {
    width: 280, // Slightly smaller width for a popup feel
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 15, // Rounded corners
    alignItems: 'center',
    elevation: 10, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1, // Border around the popup
    borderColor: '#ccc', // Light gray border
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default LoginErrorModal;

