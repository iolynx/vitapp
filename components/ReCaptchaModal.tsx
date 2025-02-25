import React, { useState, useRef } from "react";
import { View, Modal, Button } from "react-native";
import { WebView } from "react-native-webview";

const SITE_KEY = "6Ld1VmQaAAAAAGQCz6k_jbG4l1s-ncpVHzS_F5iy";
const BASE_URL = "https://vtopcc.vit.ac.in/vtop/login"; // You can change this based on your app's needs

//todo: add type declarations

const ReCaptchaModal = ({ visible, onCaptchaSolved }) => {
  const webViewRef = useRef(null);

  // reCAPTCHA HTML (served within WebView)
  const reCaptchaHtml = `
    <html>
      <head>
        <script src="https://www.google.com/recaptcha/api.js"></script>
        <script>
          function onCaptchaSuccess(token) {
            window.ReactNativeWebView.postMessage(token);
          }
        </script>
      </head>
      <body>
        <div class="g-recaptcha" data-sitekey="${SITE_KEY}" data-callback="onCaptchaSuccess"></div>
      </body>
    </html>
  `;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}>
        <View style={{ margin: 20, backgroundColor: "white", padding: 20, borderRadius: 10 }}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: reCaptchaHtml, baseUrl: BASE_URL }}
            onMessage={(event) => {
              onCaptchaSolved(event.nativeEvent.data); // Pass solved token
            }}
            style={{ height: 10, flex: 1 }}
          />
          <Button title="Close" onPress={() => onCaptchaSolved(null)} />
        </View>
      </View>
    </Modal>
  );
};

export default ReCaptchaModal;
