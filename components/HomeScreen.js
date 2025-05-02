import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl,
} from 'react-native';
import WeatherHeader from './WeatherHeader';
import ActivityCard from './ActivityCard';
import { fetchWeatherData } from '../src/api/weatherApi';
import * as Location from 'expo-location';
import { useAuth } from '../src/context/AuthContext';
import supabase from '../src/supabase';

const HomeScreen = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(''); // User input location
  const [mapLocation, setMapLocation] = useState(null); // Map location
  const [activities, setActivities] = useState([]); // Activities for the card
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current location on initial load
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const cityName = reverseGeocode[0].city || 'Unknown Location';
          setLocation(cityName);
          
          // Set initial map location
          const locationDetails = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            city: cityName
          };
          setMapLocation(locationDetails);

          // Fetch initial weather data
          const weatherResponse = await fetchWeatherData(cityName);
          setWeatherData(weatherResponse);

          // Set some sample activities
          setActivities([
            { id: '1', label: 'Walking', count: '2,456' },
            { id: '2', label: 'Running', count: '1,234' },
            { id: '3', label: 'Cycling', count: '789' }
          ]);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Handle location search
  const handleLocationSearch = async () => {
    if (!location) return;

    try {
      // Geocode the location
      const geocode = await Location.geocodeAsync(location);
      
      if (geocode.length > 0) {
        // Create location object
        const locationDetails = {
          latitude: geocode[0].latitude,
          longitude: geocode[0].longitude,
          city: location
        };

        // Update map location
        setMapLocation(locationDetails);

        // Fetch weather data
        const weatherResponse = await fetchWeatherData(location);
        setWeatherData(weatherResponse);

        // You can modify activities based on location if needed
        setActivities([
          { id: '1', label: 'Local Walking', count: '1,456' },
          { id: '2', label: 'City Exploration', count: '789' },
          { id: '3', label: 'Urban Cycling', count: '345' }
        ]);
      } else {
        console.warn('Location not found');
      }
    } catch (error) {
      console.error('Search location error:', error);
    }
  };

  const saveCurrentLocation = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to save locations');
      return;
    }

    if (!mapLocation) {
      Alert.alert('Error', 'Location data is not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .insert([
          { 
            user_id: user.id, 
            name: mapLocation.city,
            latitude: mapLocation.latitude,
            longitude: mapLocation.longitude,
            created_at: new Date(),
          }
        ]);

      if (error) {
        Alert.alert('Error', 'Could not save location');
        console.error(error);
      } else {
        Alert.alert('Success', 'Current location saved to your favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    }
  };

  // Function to handle refresh when pulled down
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Always get current physical location on refresh
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const cityName = reverseGeocode[0].city || 'Unknown Location';
          setLocation(cityName);
          
          const locationDetails = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            city: cityName
          };
          setMapLocation(locationDetails);

          const weatherResponse = await fetchWeatherData(cityName);
          setWeatherData(weatherResponse);
        }
      } else {
        Alert.alert(
          "Location Permission", 
          "Location permission is required to refresh with current location"
        );
      }
    } catch (error) {
      console.error('Error refreshing weather data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={require('../assets/background.jpg')} 
        style={styles.background}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFCB39"
                colors={["#FFCB39"]}
                progressBackgroundColor="#2a3a5d"
              />
            }
          >
            {/* Location Search Input */}
            <View style={styles.locationInputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter location"
                placeholderTextColor="white"
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity 
                style={styles.searchButton} 
                onPress={handleLocationSearch}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Weather Header */}
            <WeatherHeader
              weatherData={
                weatherData || {
                  temperature: '--',
                  location: 'Not Found',
                  condition: '...',
                  realFeel: '--',
                  wind: '--',
                  uv: '--',
                }
              }
            />

            {/* Activity Card with Location */}
            <ActivityCard 
              activities={activities} 
              location={mapLocation} 
            />

            {/* Save location button (only visible when logged in) */}
            {user && (
              <TouchableOpacity 
                style={styles.saveLocationButton}
                onPress={saveCurrentLocation}
              >
                <Text style={styles.saveLocationButtonText}>Save Current Location</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  locationInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#FFCB39',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  saveLocationButton: {
    backgroundColor: '#FFCB39',
    padding: 15,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveLocationButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen; 