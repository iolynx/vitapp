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
      paddingVertical: 50,
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

  const handleDebug = () => {
    console.log(SecureStore.getItem('timetable'));
    console.log(SecureStore.getItem('courses'));
  }

  return (
    <View style={styles.container}>
      <Text variant="displayMedium"> About Us </Text>
      <Text variant="labelMedium"> We are pretty cool </Text>

      <Button mode="contained" onPress={clearData} style={styles.button}>
        Clear Data
      </Button>

      <Button mode="contained" onPress={navigateToLogin} style={styles.button}>
        Login
      </Button>

      <Button mode="contained" onPress={handleDebug} style={styles.button}>
        Debug
      </Button>

    </View>
  )
}

