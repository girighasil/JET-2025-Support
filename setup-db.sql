-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail TEXT,
  created_by INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  rich_content TEXT,
  video_urls JSONB,
  resource_links JSONB,
  attachments JSONB
);

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course_id INTEGER,
  duration INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scheduled_for TIMESTAMP,
  has_negative_marking BOOLEAN NOT NULL DEFAULT FALSE,
  default_negative_marking TEXT DEFAULT '0',
  default_points TEXT DEFAULT '1',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  points INTEGER NOT NULL DEFAULT 1,
  negative_points INTEGER DEFAULT 0,
  points_float TEXT,
  negative_points_float TEXT,
  explanation TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create test_attempts table
CREATE TABLE IF NOT EXISTS test_attempts (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  total_points INTEGER,
  correct_points INTEGER,
  negative_points INTEGER,
  total_points_float TEXT,
  correct_points_float TEXT,
  negative_points_float TEXT,
  answers JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}'
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id, course_id)
);

-- Create doubt_sessions table
CREATE TABLE IF NOT EXISTS doubt_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  teacher_id INTEGER,
  topic TEXT NOT NULL,
  description TEXT,
  scheduled_for TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create study_times table
CREATE TABLE IF NOT EXISTS study_times (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  module_id INTEGER,
  test_id INTEGER,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  resource_id INTEGER,
  resource_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create session table for storing sessions
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- Create demo users
INSERT INTO users (username, password, email, full_name, role)
VALUES 
  ('admin', 'hashed_admin123', 'admin@mathsmagic.com', 'Admin User', 'admin'),
  ('teacher', 'hashed_teacher123', 'teacher@mathsmagic.com', 'Teacher User', 'teacher'),
  ('student', 'hashed_student123', 'student@mathsmagic.com', 'Student User', 'student')
ON CONFLICT (username) DO NOTHING;