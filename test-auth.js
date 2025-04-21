// Simple test script to test authentication
import fetch from 'node-fetch';

async function testAuth() {
  try {
    // Login as teacher
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
    
    // Test accessing a protected endpoint
    console.log('\nAccessing a protected endpoint (course)...');
    const protectedResponse = await fetch('http://localhost:5000/api/courses/1', {
      headers: {
        Cookie: cookies,
      },
    });
    
    if (!protectedResponse.ok) {
      throw new Error(`Protected endpoint access failed: ${protectedResponse.status} ${protectedResponse.statusText}`);
    }
    
    const courseData = await protectedResponse.json();
    console.log('Protected endpoint access successful!');
    console.log('Course data:', JSON.stringify(courseData, null, 2));
    
    // Test accessing modules endpoint
    console.log('\nAccessing modules endpoint...');
    const modulesResponse = await fetch('http://localhost:5000/api/courses/1/modules', {
      headers: {
        Cookie: cookies,
      },
    });
    
    if (!modulesResponse.ok) {
      throw new Error(`Modules endpoint access failed: ${modulesResponse.status} ${modulesResponse.statusText}`);
    }
    
    const modulesData = await modulesResponse.json();
    console.log('Modules endpoint access successful!');
    console.log('Modules data:', JSON.stringify(modulesData, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();