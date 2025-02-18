import { Text, View, StyleSheet, Button } from "react-native";
import React, { useState } from 'react';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>cgpa: 4.55 (analysis: ur cgpa is dogshit lel)</Text>
      <Text style={styles.text}>attendance: 23% (debarmaxxing) </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
});

