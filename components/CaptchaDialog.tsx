import React, { useState } from 'react';
import { Modal, View, TextInput, Image, Button } from 'react-native';

const CaptchaDialog = ({ visible, image, onSubmit, onCancel }) => {
  const [captchaText, setCaptchaText] = useState('');

  return (
    <Modal transparent={true} visible={visible} animationType="slide">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Image source={{ uri: image }} style={{ width: 200, height: 100 }} />
          <TextInput placeholder="Enter captcha" onChangeText={setCaptchaText} value={captchaText} />
          <Button title="Submit" onPress={() => onSubmit(captchaText)} />
          <Button title="Cancel" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
};

export default CaptchaDialog;

