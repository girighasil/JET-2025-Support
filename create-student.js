// Create a student2 account
import { Pool, neonConfig } from '@neondatabase/serverless';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import WebSocket from 'ws';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  neonConfig.webSocketConstructor = WebSocket;
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create student2 user
    const studentPassword = await hashPassword('student123');
    await pool.query(`
      INSERT INTO users (username, password, email, full_name, role)
      VALUES ('student2', $1, 'student2@example.com', 'Student Two', 'student')
    `, [studentPassword]);
    console.log('Created student2 user');
    
    // List all users
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id');
    console.log('\nAll users in database:');
    console.table(result.rows);
    
    console.log('\nNew login credentials:');
    console.log('- Student: username=student2, password=student123');
    
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await pool.end();
  }
}

main();