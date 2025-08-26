const axios = require('axios');

const testFetchOutletUsers = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/outlet-users', {
            params: {
                currentUserId: 1, // Replace with a valid superadmin user ID
                roleLevel: 'superadmin',
                hotelid: 1 // Replace with a valid hotel ID if needed
            }
        });
        console.log('Outlet Users:', response.data);
    } catch (error) {
        console.error('Error fetching outlet users:', error.response ? error.response.data : error.message);
    }
};

testFetchOutletUsers();
