import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Location from 'expo-location';

// Configure calendar locale
LocaleConfig.locales['en'] = {
  monthNames: [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
LocaleConfig.defaultLocale = 'en';

const ActivityCard = ({ activities = [], location }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Animation value for fade-in effect
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Start fade-in animation when component mounts
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update map region when location prop changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setLoading(false);
    } else {
      setError('Location data unavailable');
      setLoading(false);
    }
  }, [location]);

  // Marked dates for calendar
  const markedDates = {
    [selectedDate]: { selected: true, selectedColor: '#FFCB39' },
    // Add dynamic marked dates based on activities if needed
  };

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCB39" />
        <Text style={styles.loadingText}>Loading activities...</Text>
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Map Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location Map</Text>
          <View style={styles.mapWrapper}>
            {mapRegion && (
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={mapRegion}
                loadingEnabled={true}
                loadingIndicatorColor="#FFCB39"
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title={location.city || "Current Location"}
                  description="Your selected location"
                />
              </MapView>
            )}
          </View>
        </View>

        {/* Calendar Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Activity Calendar</Text>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'rgba(13, 31, 45, 0.95)',
              textSectionTitleColor: '#4fc3f7',
              selectedDayBackgroundColor: '#FFCB39',
              selectedDayTextColor: '#2a3a5d',
              todayTextColor: '#FFCB39',
              dayTextColor: '#ffffff',
              textDisabledColor: 'rgba(255, 255, 255, 0.3)',
              dotColor: '#4fc3f7',
              selectedDotColor: '#2a3a5d',
              monthTextColor: '#4fc3f7',
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14
            }}
          />
        </View>

        {/* Activities List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <ScrollView 
            style={styles.activitiesContainer}
            contentContainerStyle={styles.activitiesContent}
            showsVerticalScrollIndicator={false}
          >
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View>
                  <Text style={styles.activityCount}>{activity.count}</Text>
                  <Text style={styles.activityLabel}>{activity.label}</Text>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>↻</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 15,
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4fc3f7',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  sectionContainer: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 195, 247, 0.2)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4fc3f7',
    marginBottom: 12,
  },
  mapWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  activitiesContainer: {
    maxHeight: 300,
  },
  activitiesContent: {
    paddingVertical: 8,
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  activityCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 14,
    color: '#4fc3f7',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFCB39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#2a3a5d',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActivityCard;