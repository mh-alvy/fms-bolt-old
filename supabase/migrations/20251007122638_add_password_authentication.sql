/*
  # Add Password Authentication Support

  ## Changes Made
  
  1. **Schema Updates**
     - Add `password_hash` column to users table for storing bcrypt hashed passwords
     - Set NOT NULL constraint with default empty string for existing users
  
  2. **Password Hashing Function**
     - Create `hash_password` function using pgcrypto extension for secure password hashing
     - Uses bcrypt algorithm with proper salt generation
  
  3. **Password Verification Function**
     - Create `verify_password` function to securely compare passwords
     - Returns boolean indicating if password matches hash
  
  4. **Demo User Passwords**
     - Update admin user with password hash for 'admin123'
     - Update manager user with password hash for 'manager123'
     - Update developer user with password hash for 'dev123'
  
  ## Security Notes
  - Uses bcrypt for password hashing (industry standard)
  - Passwords are never stored in plain text
  - Salt is automatically generated for each password
  - Hash verification is done server-side for security
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add password_hash column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create function to hash passwords using bcrypt
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password text, password_hash text)
RETURNS boolean AS $$
BEGIN
  RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update demo users with hashed passwords
UPDATE users 
SET password_hash = hash_password('admin123')
WHERE username = 'admin';

UPDATE users 
SET password_hash = hash_password('manager123')
WHERE username = 'manager';

UPDATE users 
SET password_hash = hash_password('dev123')
WHERE username = 'developer';

-- Create index on username for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
