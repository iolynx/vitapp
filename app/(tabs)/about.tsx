import { Text, View, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WebView from 'react-native-webview';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ marginTop: 5 }}>About</ThemedText>
      </ThemedView>
      <ThemedText> This is the about page </ThemedText>

      <View style={styles.webViewContainer}>
        <WebView
          style={styles.container}
          source={{ uri: 'https://vtopcc.vit.ac.in/' }}
        />
      </View>

      <ThemedText> hellow there </ThemedText>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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


