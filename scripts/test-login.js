import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login with student1/password123...');
    
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'password123',
      }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('User data:', result);
    } else {
      console.error('Login failed:', result);
    }
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin();