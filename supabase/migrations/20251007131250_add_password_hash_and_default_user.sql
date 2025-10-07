/*
  # Add Password Authentication and Default Developer User

  ## Overview
  This migration adds password hashing capability and creates a default developer user
  for the system. The authentication system will use bcrypt-compatible password hashing.

  ## Changes
  
  1. Add password_hash column to users table
     - `password_hash` (text) - Stores bcrypt-hashed password
  
  2. Create default developer user
     - Username: developer
     - Password: dev123 (will be hashed)
     - Role: developer
     - Email: developer@breakthefear.local
  
  3. Add password management functions
     - Function to hash passwords using pgcrypto extension
     - Function to verify passwords
  
  ## Security Notes
  - Passwords are hashed using bcrypt (via crypt function)
  - Password hashes are never exposed to client
  - Only developers can manage users
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;

-- Create function to hash password
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify password
CREATE OR REPLACE FUNCTION verify_password(password text, password_hash text)
RETURNS boolean AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_username text, p_password text)
RETURNS TABLE(
  id uuid,
  username text,
  email text,
  role text,
  authenticated boolean
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Get user by username
  SELECT u.id, u.username, u.email, u.role, u.password_hash
  INTO v_user
  FROM users u
  WHERE u.username = p_username;
  
  -- Check if user exists and password matches
  IF v_user.id IS NOT NULL AND verify_password(p_password, v_user.password_hash) THEN
    RETURN QUERY SELECT v_user.id, v_user.username, v_user.email, v_user.role, true;
  ELSE
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, NULL::text, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default developer user if not exists
DO $$
DECLARE
  v_hashed_password text;
BEGIN
  -- Check if developer user already exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'developer') THEN
    -- Hash the default password
    v_hashed_password := hash_password('dev123');
    
    -- Insert default developer user
    INSERT INTO users (id, username, email, role, password_hash, created_at, updated_at)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'developer',
      'developer@breakthefear.local',
      'developer',
      v_hashed_password,
      now(),
      now()
    );
  END IF;
END $$;

-- Grant execute permissions on authentication functions
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO anon, authenticated;