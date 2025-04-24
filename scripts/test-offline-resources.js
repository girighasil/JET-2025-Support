import fetch from 'node-fetch';
import { randomBytes } from 'crypto';

// Helper function to generate a random access key
function generateAccessKey() {
  return randomBytes(32).toString('hex');
}

// Get cookie from login response to maintain session
async function login() {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'student1',
      password: 'password123',
    }),
    redirect: 'manual',
  });
  
  // Get session cookie
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

// Test creating an offline resource
async function createOfflineResource(sessionCookie) {
  try {
    console.log('Testing offline resource creation...');
    
    const response = await fetch('http://localhost:5000/api/offline-resources/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie,
      },
      body: JSON.stringify({
        resourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        resourceType: 'video',
        resourceTitle: 'Sample Video Resource',
        courseId: 1,
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Offline resource request successful!');
      console.log('Resource data:', result);
      return result;
    } else {
      console.error('Offline resource request failed:', result);
      return null;
    }
  } catch (error) {
    console.error('Error during offline resource request test:', error);
    return null;
  }
}

// Test listing offline resources
async function listOfflineResources(sessionCookie) {
  try {
    console.log('Testing offline resources listing...');
    
    const response = await fetch('http://localhost:5000/api/offline-resources', {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
      },
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Offline resources listing successful!');
      console.log('Resources:', result);
    } else {
      console.error('Offline resources listing failed:', result);
    }
  } catch (error) {
    console.error('Error during offline resources listing test:', error);
  }
}

// Main test function
async function runTests() {
  try {
    // Login to get session cookie
    const sessionCookie = await login();
    if (!sessionCookie) {
      console.error('Failed to login and get session cookie');
      return;
    }
    
    console.log('Login successful, obtained session cookie');
    
    // Test creating an offline resource
    const resourceResult = await createOfflineResource(sessionCookie);
    
    // Test listing offline resources
    await listOfflineResources(sessionCookie);
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run tests
runTests();