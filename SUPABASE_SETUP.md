# Supabase Setup Instructions

## Database Connection String
```
postgresql://postgres:viray123@db.kytoiiheponorxhbjbek.supabase.co:5432/postgres
```

## Updated API Keys
```
EXPO_PUBLIC_SUPABASE_URL=https://kytoiiheponorxhbjbek.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dG9paWhlcG9ub3J4aGJqYmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NjM3NjgsImV4cCI6MjA1OTIzOTc2OH0.ro_75LpJBbZPpdTCvLm-dVtVwGxX-wkUE-ZnfMwY8dQ
```

## EMERGENCY FIX: Temporarily Disable RLS

If you're still stuck with the RLS policy error and can't get the other solutions to work, you can temporarily disable RLS to get past registration:

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Select your project (kytoiiheponorxhbjbek)
3. Go to SQL Editor
4. Click "New Query"
5. Run this command to temporarily disable RLS:

```sql
-- Temporarily disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

Once you've successfully registered, you can re-enable RLS:

```sql
-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add all necessary policies
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
```

## Important: Fixing RLS Policy Error

If you're seeing the error: `"new row violates row-level security policy for table \"profiles\""`, follow these steps:

1. Go to your [Supabase dashboard](https://app.supabase.com)
2. Select your project (kytoiiheponorxhbjbek)
3. Go to SQL Editor
4. Click "New Query"
5. Paste and run the following SQL:

```sql
-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the profiles table (if it doesn't exist already)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT UNIQUE, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- The important part: add the INSERT policy
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Add other policies
CREATE POLICY "Users can view own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

This will:
1. Create the profile table if it doesn't exist
2. Enable Row Level Security
3. Add the required INSERT policy that was missing
4. Add other necessary policies and triggers

## Setup Steps (Full Database Setup)

If you're setting up the database from scratch, follow these steps:

1. Log in to the Supabase dashboard
2. Navigate to the SQL Editor
3. Run the SQL commands in the following order:

### 0. Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1. Set up Profiles Table
Copy and paste the contents of `src/db/profiles_table.sql` into the SQL editor and run it.

This will create a table to store user profile information that extends the built-in auth.users table.

### 2. Set up Saved Locations Table
Copy and paste the contents of `src/db/saved_locations_table.sql` into the SQL editor and run it.

This will create a table to store user-saved weather locations.

### 3. Set up Todos Table
Copy and paste the contents of `src/db/todos_table.sql` into the SQL editor and run it.

This will create a table to store user todos for testing the Supabase connection.

## Authentication Setup

1. In the Supabase dashboard, go to Authentication → Settings
2. Configure the following:
   - Enable Email confirmations: OFF for development (ON for production)
   - Enable Email signups: ON
   - Customize email templates if desired

## API Keys

The updated connection string and API keys are now set up in the `src/supabase.js` file.

## Database Tables

### profiles
- `id` (UUID, Primary Key) - References auth.users id
- `username` (TEXT, Unique)
- `email` (TEXT, Unique)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### saved_locations
- `id` (UUID, Primary Key)
- `user_id` (UUID) - References auth.users id
- `name` (TEXT) - Location name
- `latitude` (DOUBLE PRECISION)
- `longitude` (DOUBLE PRECISION)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### todos
- `id` (UUID, Primary Key)
- `user_id` (UUID) - References auth.users id
- `title` (TEXT) - Todo title
- `description` (TEXT) - Todo description
- `is_complete` (BOOLEAN) - Completion status
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Troubleshooting

### Common RLS Errors

1. **"new row violates row-level security policy for table profiles"**
   - Solution: The INSERT policy is missing for the profiles table. Run the SQL in the "Fixing RLS Policy Error" section.

2. **"Permission denied"**
   - Solution: Check if the user has the correct permissions. Make sure your policies are correctly referencing auth.uid().

3. **Database connection issues**
   - Solution: Verify your API keys and URL in the supabase.js file.

## Extensions

Make sure the following PostgreSQL extensions are enabled:
- `uuid-ossp` - For UUID generation 