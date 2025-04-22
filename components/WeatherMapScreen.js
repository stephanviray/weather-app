import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { useAuth } from '../src/context/AuthContext';

const WeatherMapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 10.764,
    longitude: 122.462,
    zoom: 6,
  });
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Continue with default region if permission denied
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          zoom: 8,
        });
      } catch (error) {
        console.log('Error getting location', error);
        // Use default region if location cannot be determined
      }
    })();
  }, []);

  // Construct the URL with the current region
  const zoomEarthUrl = `https://zoom.earth/maps/satellite/#view=${region.latitude},${region.longitude},${region.zoom}z/overlays=wind`;

  // Enhanced script to hide ALL download app prompts
  const HIDE_ELEMENTS_SCRIPT = `
    (function() {
      function hideAppDownloadElements() {
        // List of selectors that might contain app download prompts
        const selectors = [
          '.app-banner', '.download-app', '.app-download', 
          '[class*="download"]', '[id*="download"]',
          '[class*="app-"]', '[id*="app-"]',
          '.mobile-app', '#mobile-app',
          '.install-app', '#install-app',
          '.app-promotion', '#app-promotion',
          '.get-app', '#get-app',
          '.cookie-banner', '.privacy-banner',
          '.promotion', '.popup',
          // Navigation and UI elements we want to keep
          'header', 'footer', '.menu', '.toolbar', '.navigation'
        ];
        
        // Target elements with these text content
        const textMatches = ['download', 'app', 'mobile app', 'get the app', 'install'];
        
        // Hide by selectors
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              // Don't hide navigation elements
              if (!el.classList.contains('navigation') && 
                  !el.classList.contains('menu') && 
                  !el.classList.contains('toolbar')) {
                el.style.display = 'none';
              }
            });
          } catch (e) {
            // Ignore errors for non-existent selectors
          }
        });
        
        // Hide any fixed or absolute positioned elements that might be popups
        const positionedElements = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"], div[style*="position: absolute"], div[style*="position:absolute"]');
        positionedElements.forEach(el => {
          // Check if it contains app-related text
          const text = el.innerText.toLowerCase();
          if (textMatches.some(match => text.includes(match))) {
            el.style.display = 'none';
          }
        });
        
        // Remove download buttons
        document.querySelectorAll('a, button').forEach(el => {
          const text = el.innerText.toLowerCase();
          if (textMatches.some(match => text.includes(match))) {
            el.style.display = 'none';
          }
        });
        
        // Remove cookie consent notices which often appear at bottom
        const possibleCookieNotices = document.querySelectorAll('div[class*="cookie"], div[id*="cookie"], div[class*="consent"], div[id*="consent"]');
        possibleCookieNotices.forEach(el => {
          el.style.display = 'none';
        });
      }
      
      // Run immediately
      hideAppDownloadElements();
      
      // Run when DOM is fully loaded
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideAppDownloadElements);
      }
      
      // Also run after everything is loaded, including images
      window.addEventListener('load', hideAppDownloadElements);
      
      // And periodically to catch dynamically added elements
      const intervalId = setInterval(hideAppDownloadElements, 800);
      
      // Clear interval after 20 seconds to save resources
      setTimeout(() => clearInterval(intervalId), 20000);
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
});

export default WeatherMapScreen; 