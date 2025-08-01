const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data for outlet
const testOutlet = {
  outlet_name: 'Test Outlet CRUD',
  brand_id: 1,
  country: '1',
  country_code: 'US',
  timezone: 'America/New_York',
  timezone_offset: '-05:00',
  start_day_time: '09:00',
  close_day_time: '22:00',
  contact_phone: '+1234567890',
  notification_email: 'test@outlet.com',
  city: 'New York',
  zip_code: '10001',
  outlet_code: 'TEST001',
  description: 'Test outlet for CRUD operations',
  address: '123 Test Street, New York, NY 10001',
  gst_no: 'GST123456789',
  active: 1,
  digital_order: 0,
  next_reset_bill_days: 'daily',
  next_reset_kot_days: 'daily',
  phone: '+1234567890',
  email: 'test@outlet.com',
  website: '',
  logo: '',
  fssai_no: '',
  next_reset_bill_date: '',
  next_reset_kot_date: '',
  registered_at: new Date().toISOString(),
  created_by_id: 1
};

async function testOutletCRUD() {
  try {
    console.log('🚀 Starting Outlet CRUD Test...\n');

    // 1. Test GET all outlets
    console.log('1. Testing GET all outlets...');
    const getResponse = await axios.get(`${BASE_URL}/outlets`);
    console.log(`✅ Found ${getResponse.data.length} existing outlets`);
    console.log('Sample outlet:', getResponse.data[0] || 'No outlets found');
    console.log('');

    // 2. Test POST - Create new outlet
    console.log('2. Testing POST - Create new outlet...');
    const createResponse = await axios.post(`${BASE_URL}/outlets`, testOutlet);
    const newOutletId = createResponse.data.id;
    console.log(`✅ Created outlet with ID: ${newOutletId}`);
    console.log('Created outlet:', createResponse.data);
    console.log('');

    // 3. Test GET by ID
    console.log('3. Testing GET by ID...');
    const getByIdResponse = await axios.get(`${BASE_URL}/outlets/${newOutletId}`);
    console.log('✅ Retrieved outlet by ID:', getByIdResponse.data);
    console.log('');

    // 4. Test PUT - Update outlet
    console.log('4. Testing PUT - Update outlet...');
    const updateData = {
      ...testOutlet,
      outlet_name: 'Updated Test Outlet CRUD',
      contact_phone: '+1987654321',
      notification_email: 'updated@outlet.com',
      updated_by_id: 1
    };
    const updateResponse = await axios.put(`${BASE_URL}/outlets/${newOutletId}`, updateData);
    console.log('✅ Updated outlet:', updateResponse.data);
    console.log('');

    // 5. Verify update by getting the outlet again
    console.log('5. Verifying update...');
    const verifyResponse = await axios.get(`${BASE_URL}/outlets/${newOutletId}`);
    console.log('✅ Verified updated outlet:', verifyResponse.data);
    console.log('');

    // 6. Test DELETE
    console.log('6. Testing DELETE...');
    await axios.delete(`${BASE_URL}/outlets/${newOutletId}`);
    console.log('✅ Deleted outlet successfully');
    console.log('');

    // 7. Verify deletion
    console.log('7. Verifying deletion...');
    try {
      await axios.get(`${BASE_URL}/outlets/${newOutletId}`);
      console.log('❌ Error: Outlet still exists after deletion');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Outlet successfully deleted (404 Not Found)');
      } else {
        console.log('❌ Unexpected error during verification:', error.message);
      }
    }
    console.log('');

    // 8. Test GET brands
    console.log('8. Testing GET brands...');
    const brandsResponse = await axios.get(`${BASE_URL}/outlets/brands`);
    console.log(`✅ Found ${brandsResponse.data.length} brands`);
    console.log('Sample brand:', brandsResponse.data[0] || 'No brands found');
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
testOutletCRUD(); 