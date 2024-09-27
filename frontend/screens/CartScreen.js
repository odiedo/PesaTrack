import React, { useContext, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Modal, TextInput, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { CartContext } from './CartContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen({ route, navigation }) {
  const { cart, resetCart } = useContext(CartContext);
  const [cartItems, setCartItems] = useState(cart);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [amountReceived, setAmountReceived] = useState('');
  const [balance, setBalance] = useState(null);
  const [successMessageVisible, setSuccessMessageVisible] = useState(false);

  const incrementQuantity = (item) => {
    const updatedCartItems = cartItems.map(cartItem =>
      cartItem.id === item.id ? { ...cartItem, quantity: (cartItem.quantity || 1) + 1 } : cartItem
    );
    setCartItems(updatedCartItems);
  };

  const decrementQuantity = (item) => {
    const updatedCartItems = cartItems.map(cartItem =>
      cartItem.id === item.id && (cartItem.quantity || 1) > 1
        ? { ...cartItem, quantity: cartItem.quantity - 1 }
        : cartItem
    );
    setCartItems(updatedCartItems);
  };

  const removeItem = (item) => {
    const updatedCartItems = cartItems.filter(cartItem => cartItem.id !== item.id);
    setCartItems(updatedCartItems);
  };

  const parsePrice = (price) => {
    if (typeof price === 'string') {
      // Removes non-numeric characters and parse to float
      return parseFloat(price.replace(/[^0-9.]/g, '') || '0');
    }
    return parseFloat(price || '0');
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parsePrice(item.price);
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const handlePayWithCash = () => {
    setModalStep(2);
  };

  const handleAmountReceivedChange = (amount) => {
    setAmountReceived(amount);
    const total = getTotal();
    if (parseFloat(amount) >= total) {
      setBalance(parseFloat(amount) - total);
    } else {
      setBalance(null);
    }
  };

  const handleCompletePurchase = async () => {
    const sessionId = await AsyncStorage.getItem('sessionId'); 
    if (!sessionId) {
      Alert.alert('Error', 'You are not authenticated. Please log in.');
      navigation.navigate('Signin'); 
      return;
    }
    try {
      const purchaseItems = cartItems.map(item => ({
        id: item.id,
        quantity: item.quantity || 1,
        price: parseFloat(item.price),
      }));

      const response = await fetch('http://192.168.23.132/payment/purchase.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purchaseItems }),
      });

      if (response.ok) {
        setPaymentModalVisible(false);
        setSuccessMessageVisible(true);
        setCartItems([]); 
        resetCart();

        setTimeout(() => {
          setSuccessMessageVisible(false);
          navigation.navigate('Home');
        }, 2000);
      } else {
        console.error('Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error completing purchase:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image
              source={{ uri: item.image }}
              style={styles.cartItemImage}
            />

            <View style={styles.cartItemDetails}>
              <Text style={styles.cartItemName}>{item.name}</Text>
              <Text style={styles.cartItemPrice}>Kshs. {item.price}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => decrementQuantity(item)} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                <TouchableOpacity onPress={() => incrementQuantity(item)} style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeItem(item)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: Kshs. {getTotal().toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => setPaymentModalVisible(true)}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.paymentModalContent}>
            {modalStep === 1 && (
              <>
                <Text style={styles.summaryText}>Checkout Summary</Text>
                <FlatList
                  data={cartItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryItemText}>{item.name} x {item.quantity || 1}</Text>
                      <Text style={styles.summaryItemText}>Kshs. {item.price}</Text>
                    </View>
                  )}
                />
                <Text style={styles.summaryTotalText}>Total: Kshs. {getTotal().toFixed(2)}</Text>
                <TouchableOpacity style={styles.paymentButton} onPress={handlePayWithCash}>
                  <Text style={styles.paymentButtonText}>Pay with Cash</Text>
                </TouchableOpacity>
              </>
            )}

            {modalStep === 2 && (
              <>
                <Text style={styles.modalTitle}>Enter Amount Received</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Amount Received"
                  keyboardType="numeric"
                  value={amountReceived}
                  onChangeText={handleAmountReceivedChange}
                />
                {balance !== null && (
                  <Text style={styles.balanceText}>Balance: Kshs. {balance.toFixed(2)}</Text>
                )}
                <TouchableOpacity style={styles.completeButton} onPress={handleCompletePurchase}>
                  <Text style={styles.completeButtonText}>Complete Purchase</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {successMessageVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={successMessageVisible}
        >
          <View style={styles.modalContainer}>
            <View style={styles.successMessage}>
              <Icon name="check-circle" size={80} color="#4CAF50" style={styles.successIcon} />
              <Text style={styles.successMessageText}>Purchase Successful!</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    backgroundColor: '#007BFF',
    padding: 5,
    borderRadius: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 5,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 10,
  },
  removeButton: {
    marginLeft: 10,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#ff0000',
    paddingHorizontal: 10,
  },
  totalContainer: {
    marginTop: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItemText: {
    fontSize: 16,
  },
  summaryTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  paymentButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 16,
    color: '#28a745',
    marginBottom: 10,
  },
  completeButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  successMessage: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6.27,
    elevation: 10, // Subtle shadow effect
  },
  successIcon: {
    marginBottom: 20, // Add spacing between icon and text
  },
  successMessageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333', // Dark, clean font color
    textAlign: 'center',
  },
});
