import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Config
const TEST_ID = 1;  // Update this to an existing test ID in your database
const API_URL = `http://localhost:5000/api/tests/${TEST_ID}/questions/import`;
const TEST_CSV_PATH = path.join(process.cwd(), 'test-questions.csv');
const TEMP_CSV_PATH = path.join(process.cwd(), 'uploads/imports/test-questions.csv');
const COOKIE_FILE = path.join(process.cwd(), 'cookies_teacher.txt');

// Copy the test CSV file to the uploads directory
async function prepareTestFile() {
  fs.copyFileSync(TEST_CSV_PATH, TEMP_CSV_PATH);
  console.log('Created test CSV file at', TEMP_CSV_PATH);
  return TEMP_CSV_PATH;
}

// Login as a teacher (or admin) to get a session cookie
async function login() {
  try {
    // Try to read cookies from the file first
    if (fs.existsSync(COOKIE_FILE)) {
      console.log('Using existing session cookie from file');
      return fs.readFileSync(COOKIE_FILE, 'utf8');
    }
    
    // Otherwise, login to get a new cookie
    console.log('Logging in as teacher...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'teacher',
        password: 'teacher123',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const userInfo = await loginResponse.json();
    console.log('Login successful!', userInfo);
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies:', cookies);
    
    // Save cookies to file for future use
    fs.writeFileSync(COOKIE_FILE, cookies);
    
    return cookies;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

async function runImportTest() {
  try {
    // Login to get session cookies
    const cookies = await login();
    
    // Create a test docx file
    const docxPath = await createTestDocxFile();
    
    // Create a form data object
    const form = new FormData();
    form.append('file', fs.createReadStream(docxPath));
    
    // Make the request
    console.log(`Sending import request to ${API_URL}...`);
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: {
        Cookie: cookies
      }
    });
    
    // Parse response
    const data = await response.json();
    
    // Log results
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Clean up
    if (fs.existsSync(docxPath)) {
      fs.unlinkSync(docxPath);
      console.log('Removed test file');
    }
  } catch (error) {
    console.error('Error during import test:', error);
  }
}

// Run the test
runImportTest().then(() => console.log('Test completed'));