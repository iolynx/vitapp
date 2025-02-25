import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from "expo-router";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useState, useEffect } from 'react';
import * as SecureStore from "expo-secure-store"
import { useColorScheme } from 'react-native';

export default function RootLayout() {

  const colorScheme = useColorScheme(); //"light" or "dark"
  const theme = colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  )
}
