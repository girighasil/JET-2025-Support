#!/usr/bin/env node

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSockets for Neon
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Connecting to database...");
    
    // Add new columns to courses table
    console.log("Adding new columns to courses table...");
    await pool.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS rich_content TEXT,
      ADD COLUMN IF NOT EXISTS video_url TEXT,
      ADD COLUMN IF NOT EXISTS attachments JSONB;
    `);
    
    console.log("Schema update completed successfully");
  } catch (error) {
    console.error("Error updating schema:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);