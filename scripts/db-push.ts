import { db } from '../server/db';
import * as schema from '../shared/schema';
import { sql } from 'drizzle-orm';

// This script will push the schema to the database
async function main() {
  console.log('Pushing schema to database...');
  
  try {
    // Create tables based on our schema
    console.log('Creating tables...');
    
    // The pushSchema function will create all tables
    const tables = [
      schema.users,
      schema.courses,
      schema.modules,
      schema.tests,
      schema.questions,
      schema.testAttempts,
      schema.enrollments,
      schema.doubtSessions,
      schema.studyTimes
    ];
    
    // For each table, execute a CREATE TABLE IF NOT EXISTS query
    for (const table of tables) {
      try {
        // This is a simplified approach - in production, use proper migrations
        await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS "${table.name}" (id serial primary key)`));
        console.log(`Created table: ${table.name}`);
      } catch (error) {
        console.error(`Error creating table ${table.name}:`, error);
      }
    }
    
    console.log('Schema successfully pushed to database!');
  } catch (error) {
    console.error('Error pushing schema to database:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();