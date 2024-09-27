// CheckoutScreen.js
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function CheckoutScreen({ navigation }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleCheckout = () => {
    // Process payment and save order
    navigation.navigate('OrderHistory');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <Text>Select Payment Method:</Text>
      <Button title="Cash" onPress={() => setPaymentMethod('cash')} />
      <Button title="Credit Card" onPress={() => setPaymentMethod('creditCard')} />
      <Button title="Confirm Payment" onPress={handleCheckout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
