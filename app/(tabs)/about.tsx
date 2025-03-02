import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import WebView from 'react-native-webview';
import { Button } from 'react-native-paper';

export default function AboutScreen() {

  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondaryContainer,
    },
    webViewContainer: {
      flex: 1,
      alignSelf: 'stretch',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    button: {
      margin: 10,
      marginHorizontal: 40
    }
  });

  const clearData = () => {
    SecureStore.deleteItemAsync('username');
    SecureStore.deleteItemAsync('password')
  }

  const navigateToLogin = () => {
    router.replace("(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text variant="displayLarge"> This is the about page </Text>


      <Text variant='headlineMedium'> About Us </Text>
      <Text> We are pretty cool </Text>

      <Button mode="contained" onPress={clearData} style={styles.button}>
        Clear Data
      </Button>

      <Button mode="contained" onPress={navigateToLogin} style={styles.button}>
        Login
      </Button>

    </View>
  )
}

