import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../src/context/AuthContext';

const WeatherMapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 10.764,
    longitude: 122.462,
    zoom: 6,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required for better experience');
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: 8,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Could not get your location. Using default view.');
    } finally {
      setLoading(false);
    }
  };

  // Try to get location on initial load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Construct zoom.earth URL with current region
  const zoomEarthUrl = `https://zoom.earth/maps/satellite/#view=${region.latitude},${region.longitude},${region.zoom}z/overlays=wind`;

  // Enhanced script to hide app prompts and improve UI
  const HIDE_ELEMENTS_SCRIPT = `
    (function() {
      function hideAppDownloadElements() {
        const selectors = [
          '.app-banner', '.download-app', '.app-download', 
          '[class*="download"]', '[id*="download"]',
          '[class*="app-"]', '[id*="app-"]',
          '.mobile-app', '#mobile-app',
          '.install-app', '#install-app',
          '.app-promotion', '#app-promotion',
          '.get-app', '#get-app',
          '.cookie-banner', '.privacy-banner',
          '.promotion', '.popup'
        ];
        
        const textMatches = ['download', 'app', 'mobile app', 'get the app', 'install'];
        
        // Hide elements by selectors
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (!el.classList.contains('navigation') && 
                  !el.classList.contains('menu') && 
                  !el.classList.contains('toolbar')) {
                el.style.display = 'none';
              }
            });
          } catch (e) { /* Ignore errors for non-existent selectors */ }
        });
        
        // Hide fixed/absolute positioned elements
        const positionedElements = document.querySelectorAll(
          'div[style*="position: fixed"], div[style*="position:fixed"], div[style*="position: absolute"], div[style*="position:absolute"]'
        );
        positionedElements.forEach(el => {
          const text = el.innerText.toLowerCase();
          if (textMatches.some(match => text.includes(match))) {
            el.style.display = 'none';
          }
        });

        // Remove cookie notices
        const cookieElements = document.querySelectorAll(
          'div[class*="cookie"], div[id*="cookie"], div[class*="consent"], div[id*="consent"]'
        );
        cookieElements.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Run script at different stages
      hideAppDownloadElements();
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideAppDownloadElements);
      }
      
      window.addEventListener('load', hideAppDownloadElements);
      
      const cleanupInterval = setInterval(hideAppDownloadElements, 800);
      setTimeout(() => clearInterval(cleanupInterval), 20000);
    })();
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: zoomEarthUrl }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        injectedJavaScript={HIDE_ELEMENTS_SCRIPT}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading Weather Map...</Text>
          </View>
        )}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
            <Text style={styles.retryButtonText}>Retry Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FFCB39',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
  }
});

export default WeatherMapScreen;