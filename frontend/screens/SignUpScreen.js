import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (email && password) {
      fetch('http://192.168.100.20/payment/signup.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          id_number: idNumber,
          phone,
          email, 
          password 
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Alert.alert('Success', 'Account created successfully');
          } else {
            Alert.alert('Error', data.message || 'Signup failed');
          }
        })
        .catch(error => {
          Alert.alert('Error', 'Something went wrong');
        });
    } else {
      Alert.alert('Error', 'Please fill in all fields');
    }
  };

  return (
    <View style={styles.container}>
        <View style={styles.headerCover}>
            <Text style={styles.headerMain}>Sign up</Text>
        </View>
        <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
        />
        <TextInput
            style={styles.input}
            placeholder="ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
            keyboardType="numeric"
        />
        <TextInput
            style={styles.input}
            placeholder="Phone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
        />
        <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
        />
        <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
        <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
            {loading ? (
            <Icon name="spinner" size={24} color="#fff" type="font-awesome" />
            ) : (
            <Text style={styles.buttonText}>Sign In</Text>
            )}
        </TouchableOpacity>
        <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signin')}>
            <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  headerCover: {
    width: '100%',
    height: 60,
    borderRadius: 50,
    backgroundColor: '#0008',
    left: '-60%',
    marginBottom: 10,
  },
  headerMain: {
    textAlign: 'right',
    paddingHorizontal: 20,
    paddingVertical: 5,
    fontWeight: 'bold',
    fontSize: 32,
    color: '#fff',
  },

  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  footerLink: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignUpScreen;
