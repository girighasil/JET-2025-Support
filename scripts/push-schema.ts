import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

async function pushSchema() {
  console.log('Pushing schema to database...');
  
  try {
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "email" TEXT UNIQUE,
        "mobile_number" TEXT NOT NULL UNIQUE,
        "full_name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'student',
        "avatar" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created users table');

    // Create courses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "thumbnail" TEXT,
        "created_by" INTEGER NOT NULL REFERENCES "users"("id"),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "rich_content" TEXT,
        "video_urls" JSONB,
        "resource_links" JSONB,
        "attachments" JSONB
      );
    `);
    console.log('Created courses table');

    // Create modules table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "modules" (
        "id" SERIAL PRIMARY KEY,
        "course_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "sort_order" INTEGER NOT NULL,
        "content" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created modules table');

    // Create tests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "tests" (
        "id" SERIAL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "course_id" INTEGER,
        "duration" INTEGER NOT NULL,
        "passing_score" INTEGER NOT NULL,
        "created_by" INTEGER NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "scheduled_for" TIMESTAMP,
        "has_negative_marking" BOOLEAN NOT NULL DEFAULT false,
        "default_negative_marking" TEXT DEFAULT '0',
        "default_points" TEXT DEFAULT '1',
        "visibility" TEXT NOT NULL DEFAULT 'private',
        "test_type" TEXT NOT NULL DEFAULT 'formal',
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created tests table');

    // Create questions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" SERIAL PRIMARY KEY,
        "test_id" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "question" TEXT NOT NULL,
        "options" JSONB,
        "correct_answer" JSONB,
        "points" INTEGER NOT NULL DEFAULT 1,
        "negative_points" INTEGER DEFAULT 0,
        "points_float" TEXT,
        "negative_points_float" TEXT,
        "explanation" TEXT,
        "sort_order" INTEGER NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created questions table');

    // Create test_attempts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "test_attempts" (
        "id" SERIAL PRIMARY KEY,
        "test_id" INTEGER NOT NULL,
        "user_id" INTEGER NOT NULL,
        "started_at" TIMESTAMP DEFAULT NOW(),
        "completed_at" TIMESTAMP,
        "score" INTEGER,
        "status" TEXT NOT NULL DEFAULT 'in_progress',
        "total_points" INTEGER,
        "correct_points" INTEGER,
        "negative_points" INTEGER,
        "total_points_float" TEXT,
        "correct_points_float" TEXT,
        "negative_points_float" TEXT,
        "answers" JSONB DEFAULT '{}',
        "results" JSONB DEFAULT '{}'
      );
    `);
    console.log('Created test_attempts table');

    // Create enrollments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "enrollments" (
        "user_id" INTEGER NOT NULL,
        "course_id" INTEGER NOT NULL,
        "enrolled_at" TIMESTAMP DEFAULT NOW(),
        "progress" INTEGER NOT NULL DEFAULT 0,
        "is_completed" BOOLEAN NOT NULL DEFAULT false,
        PRIMARY KEY ("user_id", "course_id")
      );
    `);
    console.log('Created enrollments table');

    // Create enrollment_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "enrollment_requests" (
        "user_id" INTEGER NOT NULL,
        "course_id" INTEGER NOT NULL,
        "requested_at" TIMESTAMP DEFAULT NOW(),
        "status" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "reviewed_by" INTEGER,
        "reviewed_at" TIMESTAMP,
        PRIMARY KEY ("user_id", "course_id")
      );
    `);
    console.log('Created enrollment_requests table');

    // Create test_enrollment_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "test_enrollment_requests" (
        "user_id" INTEGER NOT NULL,
        "test_id" INTEGER NOT NULL,
        "requested_at" TIMESTAMP DEFAULT NOW(),
        "status" TEXT NOT NULL DEFAULT 'pending',
        "notes" TEXT,
        "reviewed_by" INTEGER,
        "reviewed_at" TIMESTAMP,
        PRIMARY KEY ("user_id", "test_id")
      );
    `);
    console.log('Created test_enrollment_requests table');

    // Create doubt_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "doubt_sessions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "teacher_id" INTEGER,
        "topic" TEXT NOT NULL,
        "description" TEXT,
        "scheduled_for" TIMESTAMP NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created doubt_sessions table');

    // Create study_times table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "study_times" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "course_id" INTEGER,
        "module_id" INTEGER,
        "test_id" INTEGER,
        "started_at" TIMESTAMP NOT NULL,
        "ended_at" TIMESTAMP,
        "duration" INTEGER,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created study_times table');

    // Create notifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "resource_id" INTEGER,
        "resource_type" TEXT,
        "is_read" BOOLEAN NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created notifications table');

    // Create site_config table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "site_config" (
        "id" SERIAL PRIMARY KEY,
        "key" TEXT NOT NULL UNIQUE,
        "value" JSONB,
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created site_config table');

    // Create promo_banners table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "promo_banners" (
        "id" SERIAL PRIMARY KEY,
        "text" TEXT NOT NULL,
        "url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 1,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created promo_banners table');

    console.log('Schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing schema to database:', error);
  }
}

pushSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error running schema push:', err);
    process.exit(1);
  });