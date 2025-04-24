// Script to test login
import fetch from 'node-fetch';

async function testLogin(username, password) {
  try {
    console.log(`Testing login for ${username}...`);
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const statusCode = response.status;
    
    if (statusCode === 200) {
      const data = await response.json();
      console.log(`✅ Login successful for ${username} (${data.role})`);
      return true;
    } else {
      const errorData = await response.json();
      console.log(`❌ Login failed for ${username}: ${errorData.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing login for ${username}:`, error.message);
    return false;
  }
}

async function main() {
  // Test student1 login (original user with reset password)
  await testLogin('student1', 'student123');
  
  // Test student2 login (new user)
  await testLogin('student2', 'student123');
  
  // Test admin login
  await testLogin('admin', 'admin123');
  
  // Test teacher login
  await testLogin('teacher', 'teacher123');
}

main();