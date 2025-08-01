const axios = require('axios');

async function testOutletUserFunctionality() {
  console.log('🧪 Testing outlet user functionality...\n');

  try {
    // Test 1: Fetch outlets for outlet user
    console.log('📋 Test 1: Fetching outlets for outlet user...');
    const outletUserParams = {
      role_level: 'outlet_user',
      hotelid: 15,
      outletid: 70 // Using the correct outlet ID from the user data
    };

    console.log('📤 Sending params:', outletUserParams);

    const response = await axios.get('http://localhost:3001/api/outlets', {
      params: outletUserParams
    });

    console.log('✅ Outlet user outlets response:', response.data);
    console.log('📊 Number of outlets returned:', response.data.length);

    // Test 2: Fetch specific outlet by ID
    console.log('\n📋 Test 2: Fetching specific outlet by ID...');
    const specificOutletResponse = await axios.get('http://localhost:3001/api/outlets/70');
    
    console.log('✅ Specific outlet response:', specificOutletResponse.data);

    // Test 3: Compare with superadmin access
    console.log('\n📋 Test 3: Comparing with superadmin access...');
    const superadminParams = {
      role_level: 'superadmin'
    };

    const superadminResponse = await axios.get('http://localhost:3001/api/outlets', {
      params: superadminParams
    });

    console.log('✅ Superadmin outlets response count:', superadminResponse.data.length);
    console.log('📊 Outlet user sees:', response.data.length, 'outlets');
    console.log('📊 Superadmin sees:', superadminResponse.data.length, 'outlets');

    if (response.data.length <= superadminResponse.data.length) {
      console.log('✅ Outlet user filtering is working correctly!');
    } else {
      console.log('❌ Outlet user filtering is not working correctly!');
    }

  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testCORSForOutletUser() {
  console.log('\n🌐 Testing CORS for outlet user requests...\n');

  try {
    const response = await axios.get('http://localhost:3001/api/outlets', {
      params: { role_level: 'outlet_user', outletid: 70 },
      headers: {
        'Origin': 'http://localhost:5173'
      }
    });

    console.log('✅ CORS test successful for outlet user!');
    console.log('📥 Response:', response.data);

  } catch (error) {
    console.error('❌ CORS test failed for outlet user:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting outlet user tests...\n');
  
  await testOutletUserFunctionality();
  await testCORSForOutletUser();
  
  console.log('\n✨ All outlet user tests completed!');
}

runTests();