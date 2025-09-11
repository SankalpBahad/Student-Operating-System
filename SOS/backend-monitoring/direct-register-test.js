const axios = require('axios');

// Configuration
const MONOLITHIC_URL = 'http://localhost:4000';
const MICROSERVICES_URL = 'http://localhost:3000';

// Test User data
const userData = {
  uid: `test_uid_${Date.now()}`,
  displayname: `Test User ${Date.now()}`,
  email: `test_user_${Date.now()}@example.com`,
  photoURL: 'https://via.placeholder.com/150'
};

// Function to test registration
async function testRegistration(baseUrl) {
  console.log(`\nTesting registration against ${baseUrl}...`);
  console.log('Request payload:', userData);
  
  try {
    const response = await axios.post(
      `${baseUrl}/api/users/register-user`,
      userData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main function
async function main() {
  console.log('=== DIRECT REGISTRATION TEST ===');
  
  console.log('\nTesting Monolithic Backend...');
  const monoResult = await testRegistration(MONOLITHIC_URL);
  
  console.log('\nTesting Microservices Backend...');
  const microResult = await testRegistration(MICROSERVICES_URL);
  
  console.log('\n=== RESULTS ===');
  console.log('Monolithic Backend:', monoResult ? 'SUCCESS' : 'FAILED');
  console.log('Microservices Backend:', microResult ? 'SUCCESS' : 'FAILED');
}

// Run the main function
main().catch(console.error); 