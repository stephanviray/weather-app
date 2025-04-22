import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const WeatherHeader = ({ weatherData }) => {
  return (
    <View style={styles.container}>
      <View>
        <View style={styles.tempContainer}>
          <Text style={styles.temperature}>{weatherData.temperature}°</Text>
          <Text style={styles.location}>C, {weatherData.location}</Text>
        </View>
        
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
      
      <View style={styles.avatar}>
        <Image
          source={{ uri: 'https://placekitten.com/100/100' }} // Placeholder image
          style={styles.avatarImage}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 48,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 48,
    fontWeight: '600',
    color: 'white',
  },
  location: {
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  detailText: {
    color: 'white',
    fontSize: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

export default WeatherHeader;