// index.jsx - FIXED VERSION
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

export default function Index() {
  // Remove all navigation logic - let _layout handle it
  // This is now just a splash screen
  
  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.blockText}>Block 13</Text>
          <Text style={styles.subText}>Federal B Area</Text>
          <Text style={styles.titleText}>Resident Welfare Association</Text>
        </View>
        <ActivityIndicator 
          size="large" 
          color="#FFFFFF" 
          style={{ marginTop: 30 }} 
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  blockText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 8,
  },
  subText: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});