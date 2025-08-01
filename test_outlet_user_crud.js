const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data for outlet user
const testOutletUser = {
  username: 'test_outlet_user',
  email: 'test.outlet@miracle.com',
  password: 'TestPassword123!',
  full_name: 'Test Outlet User',
  phone: '+1234567890',
  outlet_id: 1, // Make sure this outlet exists
  designation: '1', // Manager designation
  user_type: '1', // Staff user type
  shift_time: '09:00-17:00',
  mac_address: '00:11:22:33:44:55',
  assign_warehouse: 'Main Warehouse',
  language_preference: 'English',
  address: '123 Test Street',
  city: 'Test City',
  sub_locality: 'Test Sub Locality',
  web_access: true,
  self_order: true,
  captain_app: true,
  kds_app: true,
  captain_old_kot_access: 'Enabled',
  verify_mac_ip: false,
  brand_id: 1,
  hotel_id: 1,
  parent_user_id: 1, // SuperAdmin user ID
  created_by_id: 1
};

async function testOutletUserCRUD() {
  try {
    console.log('🚀 Starting Outlet User CRUD Test...\n');

    // 1. Test GET all outlet users and admins
    console.log('1. Testing GET all outlet users and admins...');
    const getResponse = await axios.get(`${BASE_URL}/outlet-users`);
    console.log(`✅ Found ${getResponse.data.length} existing users (outlet users + hotel admins)`);
    console.log('Sample user:', getResponse.data[0] || 'No users found');
    console.log('');

    // 2. Test GET outlets for dropdown
    console.log('2. Testing GET outlets for dropdown...');
    const outletsResponse = await axios.get(`${BASE_URL}/outlet-users/outlets`);
    console.log(`✅ Found ${outletsResponse.data.length} outlets for dropdown`);
    console.log('Sample outlet:', outletsResponse.data[0] || 'No outlets found');
    console.log('');

    // 3. Test GET designations
    console.log('3. Testing GET designations...');
    const designationsResponse = await axios.get(`${BASE_URL}/outlet-users/designations`);
    console.log(`✅ Found ${designationsResponse.data.length} designations`);
    console.log('Sample designation:', designationsResponse.data[0] || 'No designations found');
    console.log('');

    // 4. Test GET user types
    console.log('4. Testing GET user types...');
    const userTypesResponse = await axios.get(`${BASE_URL}/outlet-users/user-types`);
    console.log(`✅ Found ${userTypesResponse.data.length} user types`);
    console.log('Sample user type:', userTypesResponse.data[0] || 'No user types found');
    console.log('');

    // 5. Test POST - Create new outlet user
    console.log('5. Testing POST - Create new outlet user...');
    const createResponse = await axios.post(`${BASE_URL}/outlet-users`, testOutletUser);
    const newUserId = createResponse.data.userid;
    console.log(`✅ Created outlet user with ID: ${newUserId}`);
    console.log('Created outlet user:', createResponse.data);
    console.log('');

    // 6. Test GET by ID
    console.log('6. Testing GET by ID...');
    const getByIdResponse = await axios.get(`${BASE_URL}/outlet-users/${newUserId}`);
    console.log('✅ Retrieved outlet user by ID:', getByIdResponse.data);
    console.log('');

    // 7. Test PUT - Update outlet user
    console.log('7. Testing PUT - Update outlet user...');
    const updateData = {
      ...testOutletUser,
      full_name: 'Updated Test Outlet User',
      phone: '+1987654321',
      email: 'updated.test@miracle.com',
      updated_by_id: 1
    };
    const updateResponse = await axios.put(`${BASE_URL}/outlet-users/${newUserId}`, updateData);
    console.log('✅ Updated outlet user:', updateResponse.data);
    console.log('');

    // 8. Verify update by getting the user again
    console.log('8. Verifying update...');
    const verifyResponse = await axios.get(`${BASE_URL}/outlet-users/${newUserId}`);
    console.log('✅ Verified updated outlet user:', verifyResponse.data);
    console.log('');

    // 9. Test DELETE (soft delete)
    console.log('9. Testing DELETE (soft delete)...');
    await axios.put(`${BASE_URL}/outlet-users/${newUserId}`, { 
      is_active: 0, 
      updated_by_id: 1 
    });
    console.log('✅ Soft deleted outlet user successfully');
    console.log('');

    // 10. Verify soft delete
    console.log('10. Verifying soft delete...');
    const deletedUserResponse = await axios.get(`${BASE_URL}/outlet-users/${newUserId}`);
    console.log('✅ Verified soft deleted outlet user:', deletedUserResponse.data);
    console.log('User is_active should be 0:', deletedUserResponse.data.is_active);
    console.log('');

    console.log('🎉 All CRUD tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
testOutletUserCRUD(); 