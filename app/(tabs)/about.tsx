import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

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
  });

  const clearData = () => {
    SecureStore.deleteItemAsync('username');
    SecureStore.deleteItemAsync('password')
  }

  return (
    <View style={styles.container}>
      <Text variant="displayLarge"> This is the about page </Text>


      <Text variant='headlineMedium'> About Us </Text>
      <Text> We are pretty cool </Text>

      <Button mode="contained" onPress={clearData}>
        Clear Data
      </Button>

    </View>
  )
}


