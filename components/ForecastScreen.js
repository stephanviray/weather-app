import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  FlatList,
  Image,
  Animated,
  Easing,
  Alert,
  NetInfo
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = 'ebdd281e718392cab0ed58d3111c8612';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/onecall';
const CACHE_EXPIRY_TIME = 1000 * 60 * 30; // 30 minutes cache

// Create axios instance with default config
const forecastApi = axios.create({
  baseURL: WEATHER_API_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

const getDayOfWeek = (timestamp) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const date = new Date(timestamp * 1000);
  return days[date.getDay()];
};

// Helper function to convert time to PH time (UTC+8)
const convertToPHTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  
  // Parse the input time (assumed to be in 24-hour format)
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Create a date object for today with the given time
  const date = new Date();
  date.setHours(hours, minutes);
  
  // Convert to PH time by adding 8 hours
  date.setHours(date.getHours() + 8);
  
  // Format the time in 12-hour format with AM/PM
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const ForecastScreen = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  
  // Animation values
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);
  const weatherIconAnim = useMemo(() => new Animated.Value(0), []);
  const impactTimeAnim = useMemo(() => new Animated.Value(0), []);

  // Animation functions
  const startEntryAnimation = (delay = 0) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  };

  const startWeatherIconAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(weatherIconAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(weatherIconAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const startImpactTimeAnimation = (delay = 0) => {
    Animated.spring(impactTimeAnim, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Start animations when forecast data is loaded
  useEffect(() => {
    if (forecast) {
      startEntryAnimation();
      startWeatherIconAnimation();
      startImpactTimeAnimation(300);
    }
  }, [forecast]);

  // Try to get cached forecast data on initial load
  useEffect(() => {
    const getCachedForecast = async () => {
      try {
        const cachedData = await AsyncStorage.getItem('forecastData');
        if (cachedData) {
          const { timestamp, data, coords } = JSON.parse(cachedData);
          // Check if cache is still valid
          if (Date.now() - timestamp < CACHE_EXPIRY_TIME) {
            setForecast(data);
            setLocation({ coords });
            setLoading(false);
            // Get fresh data in background
            setTimeout(() => {
              getCurrentLocation();
            }, 0);
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('Error getting cached forecast:', err);
        return false;
      }
    };

    const getCurrentLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Lower accuracy for faster response
        });
        setLocation(location);
        
        // Fetch forecast data with a small delay to allow UI to render
        setTimeout(() => {
          fetchForecastData(location.coords.latitude, location.coords.longitude);
        }, 0);
      } catch (err) {
        setError('Could not fetch location or weather data');
        setLoading(false);
      }
    };

    // Main execution flow
    getCachedForecast().then(hasCachedData => {
      if (!hasCachedData) {
        getCurrentLocation();
      }
    });
  }, []);

  const fetchForecastData = async (latitude, longitude) => {
    try {
      // Try to make the real API call first
      const params = {
        lat: latitude,
        lon: longitude,
        exclude: 'minutely,hourly',
        units: 'metric',
        appid: API_KEY
      };

      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const response = await forecastApi.get('', { params });
          
          // Cache the successful response
          const cacheData = {
            timestamp: Date.now(),
            data: response.data.daily,
            coords: { latitude, longitude }
          };
          await AsyncStorage.setItem('forecastData', JSON.stringify(cacheData));
          
          setForecast(response.data.daily);
          setLoading(false);
          return;
        } catch (error) {
          lastError = error;
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
        }
      }

      // If all retries failed, throw the last error
      throw lastError;

    } catch (error) {
      console.error('Error fetching forecast:', error);
      
      // Check if we have cached data to use as fallback
      try {
        const cachedData = await AsyncStorage.getItem('forecastData');
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          setForecast(data);
          Alert.alert(
            'Network Issue',
            'Using cached weather data. Please check your internet connection.',
            [{ text: 'OK' }]
          );
        } else {
          // Use mock data as last resort
          const mockResponse = {
            daily: [
              {
                dt: Math.floor(Date.now() / 1000),
                temp: { day: 25, min: 20, max: 28 },
                weather: [{ main: 'Clear', icon: '01d' }],
                humidity: 65,
                wind_speed: 5.2,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400,
                temp: { day: 24, min: 19, max: 26 },
                weather: [{ main: 'Clouds', icon: '03d' }],
                humidity: 70,
                wind_speed: 4.8,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400 * 2,
                temp: { day: 23, min: 18, max: 25 },
                weather: [{ main: 'Rain', icon: '10d' }],
                humidity: 75,
                wind_speed: 6.1,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400 * 3,
                temp: { day: 21, min: 17, max: 23 },
                weather: [{ main: 'Rain', icon: '10d' }],
                humidity: 80,
                wind_speed: 7.2,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400 * 4,
                temp: { day: 22, min: 18, max: 24 },
                weather: [{ main: 'Clouds', icon: '04d' }],
                humidity: 75,
                wind_speed: 5.5,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400 * 5,
                temp: { day: 24, min: 19, max: 26 },
                weather: [{ main: 'Clear', icon: '01d' }],
                humidity: 65,
                wind_speed: 4.2,
              },
              {
                dt: Math.floor(Date.now() / 1000) + 86400 * 6,
                temp: { day: 26, min: 20, max: 28 },
                weather: [{ main: 'Clear', icon: '01d' }],
                humidity: 60,
                wind_speed: 3.8,
              }
            ]
          };
          setForecast(mockResponse.daily);
          Alert.alert(
            'Network Issue',
            'Unable to fetch latest weather data. Showing sample data.',
            [{ text: 'OK' }]
          );
        }
      } catch (cacheError) {
        console.error('Cache error:', cacheError);
        setError('Unable to load weather data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Memoize weather emoji mapping to improve performance
  const getWeatherEmoji = useMemo(() => {
    return {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'default': '❓'
    };
  }, []);

  const renderForecastItem = ({ item, index }) => {
    const weatherIcon = item.weather[0].icon;
    const weatherType = item.weather[0].main;
    const weatherEmoji = getWeatherEmoji[weatherType] || getWeatherEmoji.default;
    
    // Calculate animation delay based on index
    const itemDelay = index * 100;
    
    return (
      <Animated.View 
        style={[
          styles.forecastItem,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }
            ]
          }
        ]}
      >
        <Text style={styles.dayText}>{getDayOfWeek(item.dt)}</Text>
        <Animated.View 
          style={[
            styles.weatherIconContainer,
            {
              transform: [{
                translateY: weatherIconAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, -10, 0],
                })
              }]
            }
          ]}
        >
          <Text style={styles.weatherIconPlaceholder}>
            {weatherEmoji}
          </Text>
        </Animated.View>
        <Text style={styles.tempText}>{Math.round(item.temp.max)}° / {Math.round(item.temp.min)}°</Text>
        <Text style={styles.conditionText}>{weatherType}</Text>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Humidity: {item.humidity}%</Text>
          <Text style={styles.detailText}>Wind: {item.wind_speed} m/s</Text>
        </View>
        {item.impact_time && (
          <Animated.View 
            style={[
              styles.impactTimeContainer,
              {
                opacity: impactTimeAnim,
                transform: [{
                  translateX: impactTimeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                }]
              }
            ]}
          >
            <Text style={styles.impactTimeTitle}>Weather Impact Times (PH):</Text>
            <View style={styles.impactTimeRow}>
              <View style={styles.impactTimeItem}>
                <Text style={styles.impactTimeLabel}>Start</Text>
                <Text style={styles.impactTimeText}>{convertToPHTime(item.impact_time.start)}</Text>
              </View>
              <View style={styles.impactTimeItem}>
                <Text style={styles.impactTimeLabel}>Peak</Text>
                <Text style={styles.impactTimeText}>{convertToPHTime(item.impact_time.peak)}</Text>
              </View>
              <View style={styles.impactTimeItem}>
                <Text style={styles.impactTimeLabel}>End</Text>
                <Text style={styles.impactTimeText}>{convertToPHTime(item.impact_time.end)}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // Generate skeleton data for loading state
  const skeletonData = useMemo(() => {
    return Array(7).fill().map((_, index) => ({ id: index }));
  }, []);

  const renderSkeletonItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <View style={[styles.skeletonLine, { width: '40%' }]} />
      <View style={styles.weatherIconContainer}>
        <View style={styles.skeletonCircle} />
      </View>
      <View style={[styles.skeletonLine, { width: '60%' }]} />
      <View style={[styles.skeletonLine, { width: '30%' }]} />
      <View style={styles.detailsContainer}>
        <View style={[styles.skeletonLine, { width: '50%' }]} />
        <View style={[styles.skeletonLine, { width: '40%' }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>7-Day Forecast</Text>
        <FlatList
          data={skeletonData}
          renderItem={renderSkeletonItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7-Day Forecast</Text>
      <FlatList
        data={forecast}
        renderItem={renderForecastItem}
        keyExtractor={(item) => item.dt.toString()}
        contentContainerStyle={styles.listContainer}
        initialNumToRender={3} // Render fewer items initially
        maxToRenderPerBatch={3} // Process fewer items per batch
        windowSize={5} // Reduce window size
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1929',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4fc3f7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1929',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  forecastItem: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 25,
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
  },
  impactTimeContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 6,
  },
  impactTimeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 8,
  },
  impactTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactTimeLabel: {
    fontSize: 12,
    color: '#4fc3f7',
    fontWeight: '500',
    marginBottom: 2,
  },
  impactTimeText: {
    fontSize: 12,
    color: '#ffffff',
  },
});

export default ForecastScreen; 