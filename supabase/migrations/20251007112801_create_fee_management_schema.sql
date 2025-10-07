/*
  # Break The Fear - Fee Management System Database Schema

  ## Overview
  This migration creates the complete database schema for the Break The Fear coaching center
  fee management system. It includes all tables, relationships, indexes, and security policies.

  ## 1. New Tables

  ### users
  - `id` (uuid, primary key) - Unique user identifier
  - `username` (text, unique) - User login username
  - `email` (text, unique) - User email address  
  - `role` (text) - User role (admin, manager, developer)
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### batches
  - `id` (uuid, primary key) - Unique batch identifier
  - `name` (text, unique) - Batch name
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### courses
  - `id` (uuid, primary key) - Unique course identifier
  - `name` (text) - Course name
  - `batch_id` (uuid, foreign key) - Reference to batches table
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### months
  - `id` (uuid, primary key) - Unique month identifier
  - `name` (text) - Month name (January, February, custom names, etc.)
  - `month_number` (integer) - Month sequence number (1-999)
  - `course_id` (uuid, foreign key) - Reference to courses table
  - `payment` (numeric) - Monthly fee amount
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### institutions
  - `id` (uuid, primary key) - Unique institution identifier
  - `name` (text, unique) - Institution name
  - `address` (text) - Institution address
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### students
  - `id` (uuid, primary key) - Unique student identifier
  - `student_id` (text, unique) - Display student ID (BTF24XXXX)
  - `name` (text) - Student full name
  - `institution_id` (uuid, foreign key) - Reference to institutions table
  - `gender` (text) - Student gender
  - `phone` (text) - Student phone number
  - `guardian_name` (text) - Guardian full name
  - `guardian_phone` (text) - Guardian phone number
  - `batch_id` (uuid, foreign key) - Reference to batches table
  - `enrolled_courses` (jsonb) - Array of enrolled course IDs
  - `created_at` (timestamptz) - Enrollment timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### payments
  - `id` (uuid, primary key) - Unique payment identifier
  - `invoice_number` (text, unique) - Generated invoice number
  - `student_id` (uuid, foreign key) - Reference to students table
  - `student_name` (text) - Student name (denormalized for performance)
  - `student_display_id` (text) - Student display ID (denormalized)
  - `batch_id` (uuid, foreign key) - Reference to batches table
  - `courses` (jsonb) - Array of course IDs
  - `months` (jsonb) - Array of month IDs
  - `month_payments` (jsonb) - Detailed month-wise payment breakdown
  - `total_amount` (numeric) - Total amount before discount
  - `discount_type` (text) - fixed or percentage
  - `discount_amount` (numeric) - Discount value
  - `discount_applicable_months` (jsonb) - Array of month IDs where discount applies
  - `discounted_amount` (numeric) - Amount after discount
  - `paid_amount` (numeric) - Actually paid amount
  - `due_amount` (numeric) - Remaining due amount
  - `reference` (text) - Payment reference (cash, bank, etc.)
  - `received_by` (text) - Person who received payment
  - `created_at` (timestamptz) - Payment timestamp
  - `created_by` (uuid, foreign key) - User who created payment

  ### activities
  - `id` (uuid, primary key) - Unique activity identifier
  - `type` (text) - Activity type
  - `description` (text) - Activity description
  - `data` (jsonb) - Additional activity data
  - `user_id` (uuid, foreign key) - User who performed activity
  - `username` (text) - Username (denormalized)
  - `created_at` (timestamptz) - Activity timestamp

  ### reference_options
  - `id` (uuid, primary key) - Unique reference option identifier
  - `name` (text, unique) - Reference option name
  - `created_at` (timestamptz) - Creation timestamp

  ### receiver_options
  - `id` (uuid, primary key) - Unique receiver option identifier
  - `name` (text, unique) - Receiver name
  - `created_at` (timestamptz) - Creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Create policies for authenticated users based on roles
  - Admin and Developer roles have full access
  - Manager role has read/write access except user management
  - All users can read reference data

  ## 3. Indexes
  - Create indexes on foreign keys for performance
  - Create indexes on frequently searched fields
  - Create indexes for payment queries and reports

  ## 4. Important Notes
  - All IDs use UUID for security and scalability
  - Timestamps use timestamptz for proper timezone handling
  - JSONB used for flexible array/object storage
  - Numeric type used for currency to avoid floating point issues
  - RLS policies ensure data security by default
*/

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'developer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('fixed', 'percentage');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text UNIQUE NOT NULL,
    email text UNIQUE,
    role text NOT NULL DEFAULT 'manager',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'manager', 'developer'))
);

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_course_per_batch UNIQUE (name, batch_id)
);

-- Create months table
CREATE TABLE IF NOT EXISTS months (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    month_number integer NOT NULL DEFAULT 1,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    payment numeric(10, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_month_number CHECK (month_number > 0 AND month_number < 1000),
    CONSTRAINT unique_month_per_course UNIQUE (name, course_id)
);

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    address text NOT NULL DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id text UNIQUE NOT NULL,
    name text NOT NULL,
    institution_id uuid NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    gender text NOT NULL,
    phone text NOT NULL,
    guardian_name text NOT NULL,
    guardian_phone text NOT NULL,
    batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    enrolled_courses jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female', 'Custom'))
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number text UNIQUE NOT NULL,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    student_name text NOT NULL,
    student_display_id text NOT NULL,
    batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    courses jsonb DEFAULT '[]'::jsonb,
    months jsonb DEFAULT '[]'::jsonb,
    month_payments jsonb DEFAULT '[]'::jsonb,
    total_amount numeric(10, 2) NOT NULL DEFAULT 0,
    discount_type text DEFAULT 'fixed',
    discount_amount numeric(10, 2) DEFAULT 0,
    discount_applicable_months jsonb DEFAULT '[]'::jsonb,
    discounted_amount numeric(10, 2) NOT NULL DEFAULT 0,
    paid_amount numeric(10, 2) NOT NULL DEFAULT 0,
    due_amount numeric(10, 2) DEFAULT 0,
    reference text DEFAULT '',
    received_by text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('fixed', 'percentage')),
    CONSTRAINT valid_amounts CHECK (paid_amount >= 0 AND total_amount >= 0)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    description text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    username text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create reference_options table
CREATE TABLE IF NOT EXISTS reference_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create receiver_options table
CREATE TABLE IF NOT EXISTS receiver_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_batch_id ON courses(batch_id);
CREATE INDEX IF NOT EXISTS idx_months_course_id ON months(course_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_institution_id ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_batch_id ON payments(batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_number ON payments(invoice_number);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE months ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiver_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

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

-- RLS Policies for batches table
CREATE POLICY "Authenticated users can view batches"
    ON batches FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and developers can insert batches"
    ON batches FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can update batches"
    ON batches FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can delete batches"
    ON batches FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for courses table
CREATE POLICY "Authenticated users can view courses"
    ON courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and developers can insert courses"
    ON courses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can update courses"
    ON courses FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can delete courses"
    ON courses FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for months table
CREATE POLICY "Authenticated users can view months"
    ON months FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and developers can insert months"
    ON months FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can update months"
    ON months FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can delete months"
    ON months FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for institutions table
CREATE POLICY "Authenticated users can view institutions"
    ON institutions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert institutions"
    ON institutions FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update institutions"
    ON institutions FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins and developers can delete institutions"
    ON institutions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for students table
CREATE POLICY "Authenticated users can view students"
    ON students FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert students"
    ON students FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
    ON students FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admins and developers can delete students"
    ON students FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for payments table
CREATE POLICY "Authenticated users can view payments"
    ON payments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert payments"
    ON payments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins and developers can update payments"
    ON payments FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

CREATE POLICY "Admins and developers can delete payments"
    ON payments FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'developer')
        )
    );

-- RLS Policies for activities table
CREATE POLICY "Authenticated users can view activities"
    ON activities FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert activities"
    ON activities FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- RLS Policies for reference_options table
CREATE POLICY "Authenticated users can view reference options"
    ON reference_options FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Developers can insert reference options"
    ON reference_options FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

CREATE POLICY "Developers can update reference options"
    ON reference_options FOR UPDATE
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

CREATE POLICY "Developers can delete reference options"
    ON reference_options FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

-- RLS Policies for receiver_options table
CREATE POLICY "Authenticated users can view receiver options"
    ON receiver_options FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Developers can insert receiver options"
    ON receiver_options FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

CREATE POLICY "Developers can update receiver options"
    ON receiver_options FOR UPDATE
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

CREATE POLICY "Developers can delete receiver options"
    ON receiver_options FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'developer'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_months_updated_at BEFORE UPDATE ON months
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
