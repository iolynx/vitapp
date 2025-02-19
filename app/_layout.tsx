import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from 'expo-status-bar';
import { Stack } from "expo-router";
import { useState, useEffect } from 'react';
import * as SecureStore from "expo-secure-store"

// creating sample values for now,
// will create a script to fetch the values later
const sampleUserData = {
  name: 'John Doe',
  id: '22BCE1234',
  email: 'john.doe@vitstudent.ac.in',
};

const sampleTimeTable = {
  // empty for now
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
