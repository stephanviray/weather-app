import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Location from 'expo-location';

// Configure calendar locale (optional)
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

  // Update map region when location prop changes
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,  // Zoom level
        longitudeDelta: 0.0421, // Zoom level
      });
    }
  }, [location]);

  // Handle date selection in the calendar
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  // Marked dates (example: mark today and some events)
  const markedDates = {
    [selectedDate]: { selected: true, selectedColor: '#FFCB39' }, // Highlight selected date
    '2023-10-15': { marked: true, dotColor: 'red' }, // Example event
    '2023-10-20': { marked: true, dotColor: 'blue' }, // Example event
  };

  // If no location is provided, show loading or error
  if (!location) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Embedded Google Map */}
        <View style={styles.mapContainer}>
          <Text style={styles.mapHeader}>Map</Text>
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

        {/* Real-Time Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: 'rgba(50, 50, 50, 0.8)',
              calendarBackground: 'rgba(50, 50, 50, 0.8)',
              textSectionTitleColor: '#fff',
              selectedDayBackgroundColor: '#FFCB39',
              selectedDayTextColor: '#000',
              todayTextColor: '#FFCB39',
              dayTextColor: '#fff',
              monthTextColor: '#fff',
              arrowColor: '#FFCB39',
            }}
          />
        </View>

        {/* Activities List */}
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  calendarContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(50, 50, 50, 0.8)',
    borderRadius: 12,
  },
  mapHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  activityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityCount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  activityLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFCB39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'black',
  },
});

export default ActivityCard;