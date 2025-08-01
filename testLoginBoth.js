import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Test SuperAdmin login with email
async function testSuperAdminLogin() {
  try {
    console.log('Testing SuperAdmin login with email...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'superadmin@miracle.com',
      password: 'superadmin123'
    });
    
    console.log('✅ SuperAdmin login successful!');
    console.log('User:', response.data);
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
    return response.data;
  } catch (error) {
    console.error('❌ SuperAdmin login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test Hotel Admin login with username
async function testHotelAdminLogin() {
  try {
    console.log('\nTesting Hotel Admin login with username...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'hoteladmin1', // Use the username from your created hotel admin
      password: 'password123'
    });
    
    console.log('✅ Hotel Admin login successful!');
    console.log('User:', response.data);
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
    return response.data;
  } catch (error) {
    console.error('❌ Hotel Admin login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test invalid login attempts
async function testInvalidLogins() {
  console.log('\nTesting invalid login attempts...');
  
  // Test with wrong email
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'wrong@email.com',
      password: '12345678'
    });
    console.log('❌ Should have failed with wrong email');
  } catch (error) {
    console.log('✅ Correctly rejected wrong email');
  }
  
  // Test with wrong username
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'wrongusername',
      password: 'password123'
    });
    console.log('❌ Should have failed with wrong username');
  } catch (error) {
    console.log('✅ Correctly rejected wrong username');
  }
  
  // Test with missing credentials
  try {
    await axios.post(`${API_BASE_URL}/auth/login`, {
      password: '12345678'
    });
    console.log('❌ Should have failed with missing email/username');
  } catch (error) {
    console.log('✅ Correctly rejected missing email/username');
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting login tests...\n');
  
  await testSuperAdminLogin();
  await testHotelAdminLogin();
  await testInvalidLogins();
  
  console.log('\n✨ All tests completed!');
}

runTests().catch(console.error); 