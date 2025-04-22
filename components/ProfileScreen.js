import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import supabase from '../src/supabase';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedLocations, setSavedLocations] = useState([]);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchSavedLocations();
    checkDatabaseTables();
  }, []);

  // Function to check if required database tables exist
  const checkDatabaseTables = async () => {
    try {
      // Check if profiles table exists and has correct schema
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, created_at, updated_at')
        .limit(1);
      
      if (profilesError) {
        console.error('Profiles table error:', profilesError);
        if (profilesError.code === '42P01') {
          setError('Database setup incomplete. The profiles table is missing.');
        } else if (profilesError.code === 'PGRST204') {
          setError('Database schema incorrect. Please run the setup SQL from SUPABASE_SETUP.md');
        } else {
          setError(profilesError.message);
        }
        return;
      }

      // Check if saved_locations table exists and has correct schema
      const { error: locationsError } = await supabase
        .from('saved_locations')
        .select('id, user_id, name, latitude, longitude, created_at, updated_at')
        .limit(1);
      
      if (locationsError) {
        console.error('Saved locations table error:', locationsError);
        if (locationsError.code === '42P01') {
          Alert.alert(
            'Database Setup Required',
            'The saved_locations table is missing. Please run the setup SQL from SUPABASE_SETUP.md.'
          );
        } else if (locationsError.code === 'PGRST204') {
          Alert.alert(
            'Database Schema Error',
            'The saved_locations table has incorrect schema. Please run the setup SQL from SUPABASE_SETUP.md.'
          );
        }
      }
    } catch (error) {
      console.error('Error checking database tables:', error);
      setError('Failed to verify database setup');
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Check if it's a "no rows returned" error
        if (error.code === 'PGRST116') {
          setError('Profile not found. Please create a profile.');
          setCreatingProfile(true); // Automatically show the profile creation form
        } else {
          setError(error.message);
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id, 
            username,
            email: user.email,
          }
        ])
        .select();

      if (error) {
        if (error.code === '42501') {
          Alert.alert(
            'Permission Error',
            'Cannot create profile due to RLS policies. Please see SUPABASE_SETUP.md for instructions on fixing this.'
          );
        } else if (error.code === '42P01') {
          // Table doesn't exist error
          Alert.alert(
            'Database Error',
            'The profiles table does not exist. Please set up the database according to SUPABASE_SETUP.md.'
          );
        } else {
          Alert.alert('Error', error.message);
        }
        console.error('Error creating profile:', error);
      } else {
        setProfile(data[0]);
        setCreatingProfile(false);
        Alert.alert('Success', 'Profile created successfully');
        // Refresh saved locations after profile creation
        fetchSavedLocations();
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedLocations = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching locations:', error);
      } else {
        setSavedLocations(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
      console.error(error);
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        Alert.alert('Error', 'Failed to delete location');
        console.error(error);
      } else {
        setSavedLocations(savedLocations.filter(loc => loc.id !== locationId));
        Alert.alert('Success', 'Location removed from favorites');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCB39" />
      </View>
    );
  }

  // Show profile creation form if no profile exists
  if (!profile && !creatingProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.profileImage}
          />
          <Text style={styles.username}>{user?.email || 'User'}</Text>
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCreatingProfile(true)}
          >
            <Text style={styles.buttonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show profile creation form
  if (creatingProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.profileHeader}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.profileImage}
          />
          <Text style={styles.subtitle}>Create Profile</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TouchableOpacity
            style={styles.button}
            onPress={createProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCreatingProfile(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.profileImage}
        />
        <Text style={styles.username}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Locations</Text>
        {savedLocations.length > 0 ? (
          savedLocations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <View>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteLocation(location.id)}
              >
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noLocations}>No saved locations yet</Text>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileHeader: {
    backgroundColor: '#2a3a5d',
    padding: 30,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: '#ddd',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#FFCB39',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2a3a5d',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  noLocations: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  logoutButton: {
    backgroundColor: '#FFCB39',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen; 