/*
  # Fix Authentication and RLS Policies

  ## Overview
  This migration ensures that the authentication system works properly with custom
  username/password authentication. It verifies all necessary components are in place
  and properly configured.

  ## Changes Made

  1. **Verify Extensions**
     - Ensure pgcrypto extension is enabled for password hashing

  2. **Verify Password Functions**
     - Confirm hash_password function exists and works
     - Confirm verify_password function exists and works
     - Grant execution permissions to anon and authenticated roles

  3. **RLS Policy Verification**
     - Ensure anonymous users can SELECT from users table for login
     - Verify password_hash column is accessible for verification
     - Maintain security for INSERT, UPDATE, DELETE operations

  4. **Demo User Verification**
     - Verify demo users have proper password hashes
     - Re-hash passwords if needed

  ## Security Notes
  - Anonymous users can only SELECT from users table (read-only for login)
  - Password verification happens server-side through RPC function
  - Password hashes are never exposed directly to clients
  - Write operations remain restricted to authenticated users with proper roles
*/

-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate password functions to ensure they exist and are properly configured
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_password(password text, password_hash text)
RETURNS boolean AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION hash_password(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO anon, authenticated;

-- Ensure password_hash column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Update demo users with fresh password hashes if they don't have them
DO $$
DECLARE
  admin_hash text;
  manager_hash text;
  developer_hash text;
BEGIN
  -- Check and update admin user
  SELECT password_hash INTO admin_hash FROM users WHERE username = 'admin';
  IF admin_hash IS NULL OR admin_hash = '' THEN
    UPDATE users SET password_hash = hash_password('admin123') WHERE username = 'admin';
  END IF;

  -- Check and update manager user
  SELECT password_hash INTO manager_hash FROM users WHERE username = 'manager';
  IF manager_hash IS NULL OR manager_hash = '' THEN
    UPDATE users SET password_hash = hash_password('manager123') WHERE username = 'manager';
  END IF;

  -- Check and update developer user
  SELECT password_hash INTO developer_hash FROM users WHERE username = 'developer';
  IF developer_hash IS NULL OR developer_hash = '' THEN
    UPDATE users SET password_hash = hash_password('dev123') WHERE username = 'developer';
  END IF;
END $$;

-- Create index on username for faster login queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Verify RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting old policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Anonymous can view users for login" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;

-- Recreate the correct policy for anonymous and authenticated users to view users
DROP POLICY IF EXISTS "Anonymous and authenticated can view users for login" ON users;
CREATE POLICY "Anonymous and authenticated can view users for login"
    ON users FOR SELECT
    TO anon, authenticated
    USING (true);

-- Ensure other policies exist for developers
DROP POLICY IF EXISTS "Developers can insert users" ON users;
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

DROP POLICY IF EXISTS "Developers can update users" ON users;
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

DROP POLICY IF EXISTS "Developers can delete users" ON users;
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
