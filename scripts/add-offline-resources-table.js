import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createOfflineResourcesTable() {
  const client = await pool.connect();
  
  try {
    // Check if the table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'offline_resources'
      );
    `;
    const checkResult = await client.query(checkTableQuery);
    
    if (checkResult.rows[0].exists) {
      console.log('offline_resources table already exists, skipping creation');
      return;
    }
    
    // Create the offlineResources table
    const createTableQuery = `
      CREATE TABLE offline_resources (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        resource_type TEXT NOT NULL,
        resource_url TEXT NOT NULL,
        resource_title TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        course_id INTEGER,
        module_id INTEGER,
        downloaded_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        last_accessed_at TIMESTAMP,
        file_size INTEGER,
        access_key TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active'
      );
    `;
    
    await client.query(createTableQuery);
    console.log('Successfully created offline_resources table');
    
  } catch (error) {
    console.error('Error creating offline_resources table:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the migration
createOfflineResourcesTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });