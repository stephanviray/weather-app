import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Direct use of the Supabase URL and key
const supabaseUrl = 'https://kytoiiheponorxhbjbek.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dG9paWhlcG9ub3J4aGJqYmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NjM3NjgsImV4cCI6MjA1OTIzOTc2OH0.ro_75LpJBbZPpdTCvLm-dVtVwGxX-wkUE-ZnfMwY8dQ';

// Initialize the Supabase client
const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export default supabase; 