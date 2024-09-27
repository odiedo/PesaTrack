import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fetch products from the API with session-based authorization
export const getProductsFromJson = async () => {
  try {
    const sessionId = await AsyncStorage.getItem('sessionId');  // Get session ID

    const response = await axios.get('http://192.168.23.132/payment/fetch_products.php', {
      params: { sessionId },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [] };
  }
};

// Sync products with session-based authorization
export const syncProducts = async () => {
  try {
    const sessionId = await AsyncStorage.getItem('sessionId');

    await axios.get('http://192.168.23.132/payment/sync_products.php', {
      params: { sessionId }, 
    });
  } catch (error) {
    Alert.alert('Error', 'Something went wrong. Please try again.');
  }
};
