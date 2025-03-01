import { View, StyleSheet } from "react-native";
import { useTheme, Card, Text, TextInput, Button } from "react-native-paper";
import React, { useEffect, useState } from 'react';
import FetchUserData from "@/utils/fetchUserData";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Timetable from '@/components/Timetable';
// to the frontend guys, this is where yall gotta do that work

export default function Index() {
  const theme = useTheme();

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const storedUsername = await SecureStore.getItemAsync("username");
        const storedPassword = await SecureStore.getItemAsync("password");

        if (!storedUsername && !storedPassword) {
          console.log('No stored Username / Password data found...');
          router.replace('/(auth)/login'); // redirects to login page
        }

      } catch (error) {
        console.error("Error retrieving credentials:", error);
      }
    };
    fetchCredentials();
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.secondaryContainer }]}>
      <Timetable /> 
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});

