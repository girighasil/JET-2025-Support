import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hash(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const password = 'password123';
  const hashedPassword = await hash(password);
  console.log(`Password: ${password}`);
  console.log(`Hashed password: ${hashedPassword}`);
}

main().catch(console.error);