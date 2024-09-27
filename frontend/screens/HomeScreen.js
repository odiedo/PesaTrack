import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { CartContext } from './CartContext'; 
import { getProductsFromJson, syncProducts } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const { cart, addToCart, resetCart } = useContext(CartContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [groceriesData, setGroceriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and handle session expiration
  const fetchProducts = async () => {
    const sessionId = await AsyncStorage.getItem('sessionId'); 
    if (!sessionId) {
      Alert.alert('Error', 'You are not authenticated. Please log in.');
      navigation.navigate('SignIn'); 
      return;
    }

    try {
      const data = await getProductsFromJson();
      if (data && Array.isArray(data.products)) {
        setGroceriesData(data.products);
      } else if (data.message === 'Session expired') {
        Alert.alert('Session Expired', 'Please log in again.');
        await AsyncStorage.removeItem('sessionId');
        navigation.navigate('Signin');
      } else {
        console.error('Unexpected response format:', data);
        setGroceriesData([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
      setGroceriesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredGroceries = groceriesData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categorizedProducts = filteredGroceries.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    if (acc[product.category].length < 10) {
      acc[product.category].push(product);
    }
    return acc;
  }, {});
  const handleLogout = async () => {
    try {
      const response = await fetch('http://192.168.23.132/payment/logout.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        // Navigate to SignIn screen
        navigation.navigate('Signin');
      } else {
        // Handle errors
        console.error(result.message);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.headerMain}>
        <Text style={styles.header}>PesaTrack</Text>
        <Text style={styles.subtitle}>Your one-stop shop for all products!</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#000"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Show loading spinner while fetching data */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : (
        <ScrollView style={styles.itemsBody}>
          {/* Categorized products display */}
          {Object.keys(categorizedProducts).map((category, index) => (
            <View key={index} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <FlatList
                data={categorizedProducts[category]}
                horizontal
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.shopItem}>
                    <Image source={{ uri: "https://via.placeholder.com/100" }} style={styles.groceryImage} />
                    <View style={styles.groceryDetails}>
                      <Text style={styles.groceryName}>{item.name}</Text>
                      <Text style={styles.groceryPrice}>{item.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                      <Icon name="add-shopping-cart" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#fff" />
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('OrderHistory')}>
          <Icon name="receipt" size={24} color="#fff" />
          <Text style={styles.navText}>Recent Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={resetCart}>
          <Icon name="refresh" size={24} color="#fff" />
          <Text style={styles.navText}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
          <Icon name="shopping-cart" size={24} color="#fff" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
          <Text style={styles.navText}>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="home" size={24} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  headerMain: {
    paddingTop: 50,
    backgroundColor: '#007BFF',
    width: '100%',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ffeefe',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  cartBadge: {
    position: 'absolute',
    right: 8,
    top: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 10,
  },
  itemsBody: {
    padding: 20,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 1,
  },
  groceryImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  groceryDetails: {
    flex: 1,
  },
  groceryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groceryPrice: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 10,
  },
});
