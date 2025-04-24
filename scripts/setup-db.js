// Setup database tables based on schema
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in environment variables');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Creating tables...');
    
    // Create users table
    await client.query(`
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
    `);
    console.log('Created users table');
    
    // Create courses table
    await client.query(`
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
    `);
    console.log('Created courses table');
    
    // Create modules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        sort_order INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created modules table');
    
    // Create tests table
    await client.query(`
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
    `);
    console.log('Created tests table');
    
    // Create questions table
    await client.query(`
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
    `);
    console.log('Created questions table');
    
    // Create test_attempts table
    await client.query(`
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
    `);
    console.log('Created test_attempts table');
    
    // Create enrollments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at TIMESTAMP DEFAULT NOW(),
        progress INTEGER NOT NULL DEFAULT 0,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (user_id, course_id)
      );
    `);
    console.log('Created enrollments table');
    
    // Create doubt_sessions table
    await client.query(`
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
    `);
    console.log('Created doubt_sessions table');
    
    // Create study_times table
    await client.query(`
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
    `);
    console.log('Created study_times table');
    
    // Create notifications table
    await client.query(`
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
    `);
    console.log('Created notifications table');
    
    // Create session table for storing sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);
    console.log('Created session table');
    
    console.log('All tables created successfully');
    
    // Create demo users if they don't exist
    const existingAdmin = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (existingAdmin.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('admin', 'hashed_admin123', 'admin@mathsmagic.com', 'Admin User', 'admin');
      `);
      console.log('Created admin user');
    }
    
    const existingTeacher = await client.query('SELECT * FROM users WHERE username = $1', ['teacher']);
    if (existingTeacher.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('teacher', 'hashed_teacher123', 'teacher@mathsmagic.com', 'Teacher User', 'teacher');
      `);
      console.log('Created teacher user');
    }
    
    const existingStudent = await client.query('SELECT * FROM users WHERE username = $1', ['student']);
    if (existingStudent.rows.length === 0) {
      await client.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('student', 'hashed_student123', 'student@mathsmagic.com', 'Student User', 'student');
      `);
      console.log('Created student user');
    }
    
    client.release();
    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();