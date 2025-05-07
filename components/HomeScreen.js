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
  ActivityIndicator
} from 'react-native';
import WeatherHeader from './WeatherHeader';
import ActivityCard from './ActivityCard';
import { fetchWeatherData } from '../src/api/weatherApi';
import * as Location from 'expo-location';
import { useAuth } from '../src/context/AuthContext';
import supabase from '../src/supabase';

const HomeScreen = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState('');
  const [mapLocation, setMapLocation] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current location and weather on initial load
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is needed for accurate weather data');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
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

        // Fetch weather data
        const weatherResponse = await fetchWeatherData(cityName);
        setWeatherData(weatherResponse);

        // Set default activities
        setActivities([
          { id: '1', label: 'Walking', count: '2,456' },
          { id: '2', label: 'Running', count: '1,234' },
          { id: '3', label: 'Cycling', count: '789' }
        ]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Unable to fetch location data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSearch = async () => {
    if (!location) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const geocode = await Location.geocodeAsync(location);
      
      if (geocode.length > 0) {
        const locationDetails = {
          latitude: geocode[0].latitude,
          longitude: geocode[0].longitude,
          city: location
        };
        setMapLocation(locationDetails);

        const weatherResponse = await fetchWeatherData(location);
        setWeatherData(weatherResponse);

        setActivities([
          { id: '1', label: 'Local Walking', count: '1,456' },
          { id: '2', label: 'City Exploration', count: '789' },
          { id: '3', label: 'Urban Cycling', count: '345' }
        ]);
      } else {
        setError('Location not found. Please try a different search.');
      }
    } catch (error) {
      console.error('Search location error:', error);
      setError('Error searching location. Please try again.');
    } finally {
      setLoading(false);
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
      const { error } = await supabase
        .from('saved_locations')
        .insert([{ 
          user_id: user.id, 
          name: mapLocation.city,
          latitude: mapLocation.latitude,
          longitude: mapLocation.longitude,
          created_at: new Date(),
        }]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCB39" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={require('../assets/background.jpg')} 
        style={styles.background}
        resizeMode="cover"
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
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter location"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
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

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={getCurrentLocation}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}

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

            <ActivityCard 
              activities={activities} 
              location={mapLocation} 
            />

            {user && mapLocation && (
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
    backgroundColor: '#0a1929',
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1929',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4fc3f7',
  },
  scrollContainer: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: '#FFCB39',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
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
    fontSize: 14,
  },
  saveLocationButton: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.4)',
  },
  saveLocationButtonText: {
    color: '#4fc3f7',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default HomeScreen;