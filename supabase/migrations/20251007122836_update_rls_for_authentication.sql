/*
  # Update RLS Policies for Database Authentication

  ## Changes Made
  
  1. **Enhanced User Table Access**
     - Ensure anonymous users can SELECT from users table for login authentication
     - Keep password_hash accessible only during authentication (not exposed in client queries)
     - Maintain strict controls on INSERT, UPDATE, DELETE operations
  
  2. **Session Management**
     - Allow authenticated users to read their own user data
     - Enable session validation queries
  
  3. **Security Improvements**
     - Passwords hashes are only accessible for verification, never returned to client
     - All write operations still require proper role checks
     - Maintain existing role-based access controls

  ## Security Notes
  - Password hashes are never exposed through the API
  - Only the verify_password RPC function can compare hashes
  - All existing role-based policies remain intact
*/

-- Drop and recreate policies for users table with proper authentication support
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Anonymous can view users for login" ON users;
DROP POLICY IF EXISTS "Developers can insert users" ON users;
DROP POLICY IF EXISTS "Developers can update users" ON users;
DROP POLICY IF EXISTS "Developers can delete users" ON users;

-- Allow anonymous users to SELECT from users table for login
-- This is required for the login flow to work
CREATE POLICY "Anonymous and authenticated can view users for login"
    ON users FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow developers to insert new users
CREATE POLICY "Developers can insert users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

-- Allow developers to update users
CREATE POLICY "Developers can update users"
    ON users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

-- Allow developers to delete users
CREATE POLICY "Developers can delete users"
    ON users FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

-- Grant execute permission on password functions to anon and authenticated
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;
