// SettingsScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Tax Settings" onPress={() => {/* Navigate to tax settings */}} />
      <Button title="Currency Settings" onPress={() => {/* Navigate to currency settings */}} />
      <Button title="Logout" onPress={() => {/* Handle logout logic */}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
