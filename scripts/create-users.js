// This script creates admin, teacher, and student users
import { Pool, neonConfig } from '@neondatabase/serverless';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import WebSocket from 'ws';

const scryptAsync = promisify(scrypt);

// Function to hash password
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
    // Check if the users already exist
    const checkResult = await pool.query(`
      SELECT username FROM users 
      WHERE username IN ('admin', 'teacher', 'student') 
      ORDER BY username
    `);
    
    const existingUsers = checkResult.rows.map(r => r.username);
    console.log('Existing users:', existingUsers);
    
    // Create admin user if it doesn't exist
    if (!existingUsers.includes('admin')) {
      const adminPassword = await hashPassword('admin123');
      await pool.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('admin', $1, 'admin@example.com', 'Admin User', 'admin')
      `, [adminPassword]);
      console.log('Created admin user');
    }
    
    // Create teacher user if it doesn't exist
    if (!existingUsers.includes('teacher')) {
      const teacherPassword = await hashPassword('teacher123');
      await pool.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('teacher', $1, 'teacher@example.com', 'Teacher User', 'teacher')
      `, [teacherPassword]);
      console.log('Created teacher user');
    }
    
    // Create student user if it doesn't exist
    if (!existingUsers.includes('student')) {
      const studentPassword = await hashPassword('student123');
      await pool.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ('student', $1, 'student@example.com', 'Student User', 'student')
      `, [studentPassword]);
      console.log('Created student user');
    }
    
    // List all users
    const result = await pool.query('SELECT id, username, role FROM users ORDER BY id');
    console.log('\nAll users in database:');
    console.table(result.rows);
    
    console.log('\nLogin credentials:');
    console.log('- Admin: username=admin, password=admin123');
    console.log('- Teacher: username=teacher, password=teacher123');
    console.log('- Student: username=student, password=student123');
    
  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await pool.end();
  }
}

main();