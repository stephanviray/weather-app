-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own todos
CREATE POLICY "Users can view own todos" 
  ON todos 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to insert their own todos
CREATE POLICY "Users can insert own todos" 
  ON todos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own todos
CREATE POLICY "Users can update own todos" 
  ON todos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own todos
CREATE POLICY "Users can delete own todos" 
  ON todos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger to handle updated_at
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at(); 