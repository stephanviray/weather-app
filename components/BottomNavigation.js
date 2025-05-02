import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const BottomNavigation = () => {
  const [activeTab, setActiveTab] = React.useState('Home');
  
  const tabs = [
    { name: 'Home', icon: '🏠' },
    { name: 'Weather', icon: '☁️' },
    { name: 'Map', icon: '🗺️' },
    { name: 'Travel', icon: '✈️' },
    { name: 'Menu', icon: '≡' },
  ];
  
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => setActiveTab(tab.name)}
        >
          <View
            style={[
              styles.iconContainer,
              activeTab === tab.name ? styles.activeIconContainer : styles.inactiveIconContainer,
            ]}
          >
            <Text style={styles.iconText}>{tab.icon}</Text>
          </View>
          <Text style={styles.tabLabel}>{tab.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#0a1929',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 195, 247, 0.2)',
  },
  tabItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FFCB39',
  },
  inactiveIconContainer: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
  },
  iconText: {
    fontSize: 18,
  },
  tabLabel: {
    color: '#4fc3f7',
    fontSize: 12,
    marginTop: 4,
  },
});

export default BottomNavigation;