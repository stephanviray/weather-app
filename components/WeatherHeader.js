import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const WeatherHeader = ({ weatherData }) => {
  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
        </View>
        <Text style={styles.location}>{weatherData.location}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.icon}>☁️</Text>
            <Text style={styles.detailText}>{weatherData.condition}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.icon}>🌡️</Text>
            <Text style={styles.detailText}>Real feel: {weatherData.realFeel}°</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.icon}>💨</Text>
            <Text style={styles.detailText}>Wind: {weatherData.wind}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.icon}>☀️</Text>
            <Text style={styles.detailText}>UV: {weatherData.uv}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mainContent: {
    flex: 1,
  },
  tempContainer: {
    marginBottom: 8,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '600',
    color: '#ffffff',
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
  },
  location: {
    fontSize: 16,
    color: '#4fc3f7',
    marginBottom: 16,
    flexWrap: 'wrap'
  },
  detailsContainer: {
    backgroundColor: 'rgba(79, 195, 247, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    marginRight: 12,
    fontSize: 18,
  },
  detailText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  }
});

export default WeatherHeader;