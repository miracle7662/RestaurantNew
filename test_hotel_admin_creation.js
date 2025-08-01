const fetch = require('node-fetch');

async function testHotelAdminCreation() {
    console.log('🧪 Testing Hotel Admin Creation...\n');

    // Test data - using hotel ID 1 which exists in the database
    const testPayload = {
        username: 'test_hotel_admin',
        email: 'test@hotel.com',
        password: 'test123',
        full_name: 'Test Hotel Admin',
        phone: '1234567890',
        role_level: 'hotel_admin',
        brand_id: 1,  // Hotel ID 1 exists in database
        hotel_id: 1,  // Hotel ID 1 exists in database
        parent_user_id: 1, // SuperAdmin ID
        is_active: 1,
        created_by_id: 1
    };

    try {
        console.log('📤 Sending request with payload:', JSON.stringify(testPayload, null, 2));
        
        const response = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });

        console.log('📥 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Response body:', responseText);

        if (response.ok) {
            console.log('✅ SUCCESS: Hotel admin created successfully!');
        } else {
            console.log('❌ FAILED: Hotel admin creation failed');
        }

    } catch (error) {
        console.error('❌ ERROR:', error.message);
    }
}

// Run the test
testHotelAdminCreation(); 