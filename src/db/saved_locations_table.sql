-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own saved locations
CREATE POLICY "Users can view own saved locations" 
  ON saved_locations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own saved locations
CREATE POLICY "Users can insert own saved locations" 
  ON saved_locations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own saved locations
CREATE POLICY "Users can update own saved locations" 
  ON saved_locations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own saved locations
CREATE POLICY "Users can delete own saved locations" 
  ON saved_locations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to handle updated_at
CREATE TRIGGER update_saved_locations_updated_at
  BEFORE UPDATE ON saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at(); 