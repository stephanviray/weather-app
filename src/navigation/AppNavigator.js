import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// App Screens
import HomeScreen from '../../components/HomeScreen';
import ProfileScreen from '../../components/ProfileScreen';
import WeatherMapScreen from '../../components/WeatherMapScreen';
import ForecastScreen from '../../components/ForecastScreen';
import TodoList from '../../components/TodoList';

const Tab = createBottomTabNavigator();

// Main App Tab Navigator
const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Forecast') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Todos') {
            iconName = focused ? 'list' : 'list-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFCB39',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#2a3a5d',
          borderTopWidth: 0,
        },
        headerStyle: {
          backgroundColor: '#2a3a5d',
        },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Weather' }}
      />
      <Tab.Screen 
        name="Map" 
        component={WeatherMapScreen} 
        options={{ title: 'Weather Map' }}
      />
      <Tab.Screen 
        name="Forecast" 
        component={ForecastScreen} 
        options={{ title: 'Forecast' }}
      />
      <Tab.Screen 
        name="Todos" 
        component={TodoList} 
        options={{ title: 'Todos' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <AppTabs />
    </NavigationContainer>
  );
};

export default AppNavigator;