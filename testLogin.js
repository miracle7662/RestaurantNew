const fetch = require('node-fetch');

async function testLogin() {
    console.log('🔐 Testing login with hotel admin credentials...\n');

    // Test with the hotel admin credentials
    const loginData = {
        email: 'sai@gmail.com', // This should be the email from your hotel data
        password: 'sample123'   // The password you entered
    };

    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    console.log('');

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Login Successful!');
            console.log('='.repeat(50));
            console.log('👤 User Details:');
            console.log(`   ID: ${result.id}`);
            console.log(`   Username: ${result.username}`);
            console.log(`   Email: ${result.email}`);
            console.log(`   Full Name: ${result.name}`);
            console.log(`   Role: ${result.role_level}`);
            console.log(`   Brand ID: ${result.brand_id}`);
            console.log(`   Hotel ID: ${result.hotel_id}`);
            console.log(`   Brand Name: ${result.brand_name}`);
            console.log(`   Hotel Name: ${result.hotel_name}`);
            console.log(`   Token: ${result.token.substring(0, 50)}...`);
            console.log('='.repeat(50));
        } else {
            console.log('❌ Login Failed!');
            console.log('Error:', result.message);
        }
    } catch (error) {
        console.error('❌ Error during login test:', error.message);
    }
}

// Also test with superadmin credentials for comparison
async function testSuperAdminLogin() {
    console.log('\n🔐 Testing SuperAdmin login for comparison...\n');

    const superAdminData = {
        email: 'superadmin@miracle.com',
        password: 'superadmin123'
    };

    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('');

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(superAdminData)
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ SuperAdmin Login Successful!');
            console.log('='.repeat(50));
            console.log('👤 SuperAdmin Details:');
            console.log(`   ID: ${result.id}`);
            console.log(`   Username: ${result.username}`);
            console.log(`   Email: ${result.email}`);
            console.log(`   Full Name: ${result.name}`);
            console.log(`   Role: ${result.role_level}`);
            console.log('='.repeat(50));
        } else {
            console.log('❌ SuperAdmin Login Failed!');
            console.log('Error:', result.message);
        }
    } catch (error) {
        console.error('❌ Error during SuperAdmin login test:', error.message);
    }
}

// Run both tests
async function runTests() {
    await testLogin();
    await testSuperAdminLogin();
}

runTests(); 