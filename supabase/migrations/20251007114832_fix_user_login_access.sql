/*
  # Fix User Login Access

  ## Changes
  - Add RLS policy to allow anonymous users to SELECT from users table for login authentication
  - This enables the login process to verify credentials before authentication

  ## Security Notes
  - Only allows reading user data, not writing
  - Required for the login flow to work properly
  - Password hashes are not stored in this table (handled by Supabase Auth)
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Anonymous can view users for login" ON users;

-- Allow authenticated users to view all users
CREATE POLICY "Authenticated users can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Allow anonymous users to view users for login purposes
CREATE POLICY "Anonymous can view users for login"
    ON users FOR SELECT
    TO anon
    USING (true);
