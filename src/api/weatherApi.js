import axios from 'axios';

// Mock weather data as fallback
const mockWeatherData = {
  temperature: '24°C',
  location: 'New York, NY',
  condition: 'Partly Cloudy',
  realFeel: '25°C',
  wind: '10 km/h',
  uv: 'Medium',
};

// OpenWeather API configuration
const API_KEY = 'ebdd281e718392cab0ed58d3111c8612';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Create axios instance with default config
const weatherApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const fetchWeatherData = async (locationOrLat, lon) => {
  try {
    let params = {
      appid: API_KEY,
      units: 'metric'
    };

    // Check if we're using coordinates or location string
    if (typeof lon !== 'undefined' && typeof locationOrLat === 'number') {
      params.lat = locationOrLat;
      params.lon = lon;
    } else {
      params.q = locationOrLat;
    }

    // Make API call with retry logic
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        const response = await weatherApi.get('', { params });
        
        return {
          temperature: Math.round(response.data.main.temp),
          location: `${response.data.name}, ${response.data.sys.country}`,
          condition: response.data.weather[0].description,
          realFeel: Math.round(response.data.main.feels_like),
          wind: `${response.data.wind.speed} m/s`,
          uv: response.data.main.humidity + '% humidity',
        };
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
      }
    }

    // If all retries failed, throw the last error
    throw lastError;

  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    
    if (error.response) {
      // Server responded with error status
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response received');
    }

    // Return mock data as fallback
    return {
      ...mockWeatherData,
      location: typeof locationOrLat === 'string' ? locationOrLat : mockWeatherData.location,
    };
  }
};