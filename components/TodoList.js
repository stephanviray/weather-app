import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import supabase from '../src/supabase';
import { useAuth } from '../src/context/AuthContext';
import { fetchWeatherData } from '../src/api/weatherApi';
import * as Location from 'expo-location';

const getWeatherCategory = (temp, condition) => {
  const conditions = condition.toLowerCase();
  
  // Temperature-based categories
  if (temp >= 35) return 'Extreme Heat';
  if (temp <= 0) return 'Snow/Ice';
  
  // Condition-based categories
  if (conditions.includes('thunderstorm') || conditions.includes('storm')) return 'Storm';
  if (conditions.includes('tornado')) return 'Tornado';
  if (conditions.includes('rain')) {
    if (conditions.includes('heavy') || conditions.includes('extreme')) return 'Heavy Rain';
    return 'Light Rain';
  }
  if (conditions.includes('snow') || conditions.includes('ice')) return 'Snow/Ice';
  
  // Default mild conditions
  return 'Mild';
};

const weatherSafetyTips = {
  'Light Rain': [
    { id: 'lightrain1', title: 'Use appropriate footwear', description: 'Wear shoes with good traction to prevent slipping on wet surfaces' },
    { id: 'lightrain2', title: 'Drive carefully', description: 'Roads may be slippery. Maintain safe distance and use headlights' },
    { id: 'lightrain3', title: 'Carry umbrella/raincoat', description: 'Stay dry to prevent catching a cold' },
    { id: 'lightrain4', title: 'Check windshield wipers', description: 'Ensure wipers are in good condition for proper visibility' },
    { id: 'lightrain5', title: 'Watch for puddles', description: 'Avoid stepping in or driving through deep puddles' },
    { id: 'lightrain6', title: 'Protect electronics', description: 'Keep electronic devices in waterproof containers or bags' }
  ],
  'Mild': [
    { id: 'mild1', title: 'Stay hydrated', description: 'Even in mild weather, remember to drink water regularly' },
    { id: 'mild2', title: 'Enjoy outdoor activities', description: 'Good conditions for walking, cycling, or outdoor exercise' },
    { id: 'mild3', title: 'Check weather updates', description: 'Monitor for any weather changes throughout the day' },
    { id: 'mild4', title: 'Plan outdoor maintenance', description: 'Ideal time for home repairs or garden work' },
    { id: 'mild5', title: 'Air out your home', description: 'Open windows to improve indoor air quality' },
    { id: 'mild6', title: 'Check UV index', description: 'Use sunscreen even in mild weather if UV index is high' }
  ],
  'Storm': [
    { id: 'storm1', title: 'Stay indoors and away from windows', description: 'Find a safe room on the lowest floor of your building' },
    { id: 'storm2', title: 'Prepare emergency kit', description: 'Include flashlights, batteries, first-aid supplies, and non-perishable food' },
    { id: 'storm3', title: 'Monitor weather updates', description: 'Keep track of storm warnings and follow official guidance' },
    { id: 'storm4', title: 'Secure outdoor items', description: 'Bring in or tie down furniture, toys, and other loose objects' },
    { id: 'storm5', title: 'Charge devices', description: 'Keep phones and essential devices fully charged in case of power outages' },
    { id: 'storm6', title: 'Fill water containers', description: 'Store clean water in case of supply disruption' },
    { id: 'storm7', title: 'Check on neighbors', description: 'Ensure elderly or vulnerable neighbors are prepared' },
    { id: 'storm8', title: 'Avoid electrical equipment', description: 'Stay away from corded phones and electrical appliances' }
  ],
  'Heavy Rain': [
    { id: 'rain1', title: 'Avoid flood-prone areas', description: 'Stay away from low-lying areas and potential flood zones' },
    { id: 'rain2', title: 'Check drainage systems', description: 'Ensure gutters and drains are clear of debris' },
    { id: 'rain3', title: 'Prepare for power outages', description: 'Keep devices charged and have emergency lighting ready' },
    { id: 'rain4', title: 'Monitor flood warnings', description: 'Stay informed about local flood alerts and evacuation notices' },
    { id: 'rain5', title: 'Avoid driving', description: 'If possible, stay off roads during heavy rainfall' },
    { id: 'rain6', title: 'Move valuables higher', description: 'Relocate important items to upper floors or elevated areas' },
    { id: 'rain7', title: 'Document belongings', description: 'Take photos of valuable items for insurance purposes' },
    { id: 'rain8', title: 'Know escape routes', description: 'Plan multiple evacuation routes in case of flooding' }
  ],
  'Extreme Heat': [
    { id: 'heat1', title: 'Stay hydrated', description: 'Drink plenty of water and avoid caffeine and alcohol' },
    { id: 'heat2', title: 'Stay in air-conditioned areas', description: 'Minimize outdoor activities during peak heat hours' },
    { id: 'heat3', title: 'Check on vulnerable people', description: 'Monitor elderly neighbors and those with health conditions' },
    { id: 'heat4', title: 'Wear light clothing', description: 'Choose loose-fitting, light-colored clothes' },
    { id: 'heat5', title: 'Use sunscreen', description: 'Apply SPF 30+ sunscreen and reapply every 2 hours' },
    { id: 'heat6', title: 'Never leave pets in cars', description: 'Cars can reach deadly temperatures within minutes' },
    { id: 'heat7', title: 'Know heat illness signs', description: 'Learn to recognize heat exhaustion and heat stroke symptoms' },
    { id: 'heat8', title: 'Plan outdoor activities wisely', description: 'Schedule activities for early morning or evening' }
  ],
  'Snow/Ice': [
    { id: 'snow1', title: 'Winterize your home', description: 'Insulate pipes and maintain heating systems' },
    { id: 'snow2', title: 'Stock winter supplies', description: 'Keep salt/sand, snow shovels, and warm clothing ready' },
    { id: 'snow3', title: 'Drive carefully', description: 'Reduce speed and maintain safe distance from other vehicles' },
    { id: 'snow4', title: 'Check car emergency kit', description: 'Include blankets, flashlight, snacks, and first aid supplies' },
    { id: 'snow5', title: 'Prevent carbon monoxide poisoning', description: 'Keep vents clear of snow and ice' },
    { id: 'snow6', title: 'Watch for ice dams', description: 'Monitor roof and gutters for ice buildup' },
    { id: 'snow7', title: 'Protect outdoor pipes', description: 'Insulate exposed pipes to prevent freezing' },
    { id: 'snow8', title: 'Clear snow safely', description: 'Take breaks while shoveling and avoid overexertion' }
  ],
  'Tornado': [
    { id: 'tornado1', title: 'Find shelter immediately', description: 'Go to basement or interior room on lowest floor' },
    { id: 'tornado2', title: 'Stay away from windows', description: 'Keep away from glass and exterior walls' },
    { id: 'tornado3', title: 'Have emergency supplies ready', description: 'Prepare a kit with essentials and important documents' },
    { id: 'tornado4', title: 'Know warning signs', description: 'Learn to recognize dark/greenish skies, large hail, and rotating clouds' },
    { id: 'tornado5', title: 'Have a communication plan', description: 'Establish how to contact family members if separated' },
    { id: 'tornado6', title: 'Practice tornado drills', description: 'Ensure all family members know where to go and what to do' },
    { id: 'tornado7', title: 'Secure important documents', description: 'Keep copies of vital records in a waterproof container' },
    { id: 'tornado8', title: 'After tornado safety', description: 'Stay in shelter until all-clear is given by authorities' }
  ],
  'Fog': [
    { id: 'fog1', title: 'Use fog lights correctly', description: 'Turn on low-beam headlights and fog lights when driving' },
    { id: 'fog2', title: 'Reduce driving speed', description: 'Slow down and increase following distance' },
    { id: 'fog3', title: 'Use road markings', description: 'Follow lane markings to stay on course' },
    { id: 'fog4', title: 'Avoid distractions', description: 'Focus entirely on driving and road conditions' },
    { id: 'fog5', title: 'Plan extra travel time', description: 'Allow additional time to reach your destination' }
  ],
  'High Winds': [
    { id: 'wind1', title: 'Secure loose objects', description: 'Bring in or tie down items that could become projectiles' },
    { id: 'wind2', title: 'Stay away from trees', description: 'Avoid areas with large trees or branches that could fall' },
    { id: 'wind3', title: 'Check for damage', description: 'Inspect property for wind damage after the event' },
    { id: 'wind4', title: 'Drive carefully', description: 'Be cautious of strong crosswinds while driving' },
    { id: 'wind5', title: 'Have backup power', description: 'Prepare for possible power outages from downed lines' }
  ],
  'Dust Storm': [
    { id: 'dust1', title: 'Pull aside if driving', description: 'Park far from travel lanes and turn off all lights' },
    { id: 'dust2', title: 'Protect airways', description: 'Use a mask or damp cloth to cover nose and mouth' },
    { id: 'dust3', title: 'Stay indoors', description: 'Keep windows and doors closed during the storm' },
    { id: 'dust4', title: 'Check air filters', description: 'Clean or replace air filters after the storm' },
    { id: 'dust5', title: 'Protect eyes', description: 'Wear protective eyewear if outdoors is necessary' }
  ]
};

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCategory, setWeatherCategory] = useState('Mild');
  const [showSavedTips, setShowSavedTips] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTodos();
      getCurrentWeather();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getCurrentWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const weather = await fetchWeatherData(location.coords.latitude, location.coords.longitude);
      setWeatherData(weather);
      
      // Determine weather category based on conditions
      const category = getWeatherCategory(weather.temperature, weather.condition);
      setWeatherCategory(category);
    } catch (error) {
      console.error('Error getting weather:', error);
      setError('Failed to fetch weather data');
    }
  };

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error.message);
        setError(error.message);
        return;
      }

      setTodos(data || []);
      setError(null);
    } catch (error) {
      console.error('Error:', error.message);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addTodoToSaved = async (todo) => {
    try {
      const { error } = await supabase
        .from('todos')
        .insert([{
          user_id: user.id,
          title: todo.title,
          description: todo.description,
          is_complete: false
        }]);

      if (error) {
        Alert.alert('Error', 'Failed to save todo');
        return;
      }

      fetchTodos();
      Alert.alert('Success', 'Safety tip saved to your todos');
    } catch (error) {
      console.error('Error saving todo:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        Alert.alert('Error', 'Failed to delete todo');
        return;
      }

      fetchTodos();
      Alert.alert('Success', 'Safety tip deleted');
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const renderTodoItem = ({ item }) => (
    <View style={styles.todoItem}>
      <View style={styles.todoContent}>
        <Text style={styles.todoTitle}>{item.title}</Text>
        <Text style={styles.todoDescription}>{item.description}</Text>
      </View>
      {!todos.some(t => t.title === item.title) && (
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => addTodoToSaved(item)}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCB39" />
        <Text style={styles.loadingText}>Loading safety tips...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          fetchTodos();
          getCurrentWeather();
        }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Please login to view weather safety tips</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Weather Safety Tips</Text>
        <TouchableOpacity 
          style={styles.savedTipsButton}
          onPress={() => setShowSavedTips(true)}
        >
          <Text style={styles.savedTipsButtonText}>Saved Tips</Text>
        </TouchableOpacity>
      </View>

      {weatherData && (
        <View style={styles.weatherInfo}>
          <Text style={styles.subheader}>Current Weather:</Text>
          <Text style={styles.weatherDetails}>
            {weatherData.temperature}°C - {weatherData.condition}
          </Text>
          <Text style={styles.categoryLabel}>Recommended safety tips for: {weatherCategory}</Text>
        </View>
      )}
      
      <FlatList
        data={weatherSafetyTips[weatherCategory] || weatherSafetyTips['Mild']}
        renderItem={renderTodoItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Modal
        visible={showSavedTips}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedTips(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Tips</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSavedTips(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {todos.length > 0 ? (
              <FlatList
                data={todos}
                renderItem={({ item }) => (
                  <View style={styles.savedTodoItem}>
                    <View style={styles.savedTodoContent}>
                      <Text style={styles.todoTitle}>{item.title}</Text>
                      <Text style={styles.todoDescription}>{item.description}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteTodo(item.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={item => item.id}
              />
            ) : (
              <Text style={styles.noTipsText}>No saved tips yet</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1929',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  weatherInfo: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subheader: {
    fontSize: 16,
    color: '#4fc3f7',
    marginBottom: 4,
  },
  weatherDetails: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#4fc3f7',
    fontStyle: 'italic',
  },
  listContainer: {
    paddingBottom: 16,
  },
  todoItem: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todoContent: {
    flex: 1,
    marginRight: 12,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  todoDescription: {
    fontSize: 14,
    color: '#4fc3f7',
  },
  saveButton: {
    backgroundColor: '#FFCB39',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  saveButtonText: {
    color: '#2a3a5d',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4fc3f7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FFCB39',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#2a3a5d',
    fontWeight: '600',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  messageText: {
    fontSize: 16,
    color: '#4fc3f7',
    textAlign: 'center',
  },
  savedTipsButton: {
    backgroundColor: '#FFCB39',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  savedTipsButtonText: {
    color: '#2a3a5d',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  noTipsText: {
    textAlign: 'center',
    color: '#4fc3f7',
    fontSize: 16,
    marginTop: 20,
  },
  savedTodoItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 31, 45, 0.95)',
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedTodoContent: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TodoList; 