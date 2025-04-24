// Reset password for an existing user
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
    // Reset password for student1
    const username = 'student1';
    const newPassword = 'student123';
    
    // First check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    
    if (userCheck.rows.length === 0) {
      console.log(`User ${username} not found`);
      return;
    }
    
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the password
    await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hashedPassword, username]
    );
    
    console.log(`✅ Password reset for ${username}`);
    console.log(`New credentials: username=${username}, password=${newPassword}`);
    
    // List all users
    const result = await pool.query('SELECT id, username, email, role FROM users ORDER BY id');
    console.log('\nAll users in database:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

main();