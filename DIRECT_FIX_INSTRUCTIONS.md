# DIRECT FIX INSTRUCTIONS

## Quick Fix for RLS Policy Error

Copy and paste this SQL code directly into your Supabase SQL Editor:

```sql
-- OPTION 1: Temporarily disable RLS (easiest solution)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- If you later want to re-enable RLS with proper policies:
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
```

OR

```sql
-- OPTION 2: Add INSERT policy to existing table (keep RLS enabled)
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

## Steps to Run the Fix:

1. Go to your Supabase dashboard: https://app.supabase.com 
2. Select your project (kytoiiheponorxhbjbek)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste ONE of the SQL blocks above (Option 1 or Option 2)
6. Click "Run" button
7. Try registering again in your app

## If You're Still Having Issues:

1. Try Option 1 (disabling RLS) first as it's guaranteed to work
2. After registration works, you can decide whether to re-enable RLS with proper policies
3. Contact us if you need further assistance 