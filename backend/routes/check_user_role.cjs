const path = require('path');
const Database = require('better-sqlite3');

// Connect to the database
const db = new Database(path.join('F:','dbresto', 'miresto.db'));

console.log('Checking user "ads" role and outlet filtering...');

try {
    // Check user "ads" details
    const user = db.prepare("SELECT * FROM mst_users WHERE username = 'ads'").get();
    console.log('\n=== User "ads" details ===');
    console.log(user);
    
    if (!user) {
        console.log('User "ads" not found!');
        return;
    }
    
    // Check all outlets
    const allOutlets = db.prepare("SELECT * FROM mst_outlets").all();
    console.log('\n=== All outlets ===');
    console.log('Total outlets:', allOutlets.length);
    allOutlets.forEach(outlet => {
        console.log(`Outlet ID: ${outlet.outletid}, Name: ${outlet.outlet_name}, Created by: ${outlet.created_by_id}`);
    });
    
    // Check outlets created by user "ads"
    const userOutlets = db.prepare("SELECT * FROM mst_outlets WHERE created_by_id = ?").all(user.userid);
    console.log('\n=== Outlets created by user "ads" ===');
    console.log('User outlets:', userOutlets.length);
    userOutlets.forEach(outlet => {
        console.log(`Outlet ID: ${outlet.outletid}, Name: ${outlet.outlet_name}`);
    });
    
    // Simulate the filtering logic
    console.log('\n=== Simulating filtering logic ===');
    console.log('User role_level:', user.role_level);
    console.log('User hotel_id:', user.hotel_id);
    console.log('User brand_id:', user.brand_id);
    console.log('User userid:', user.userid);
    
    let query = `
        SELECT o.*, h.hotel_name as brand_name 
        FROM mst_outlets o 
        LEFT JOIN HotelMasters h ON o.brand_id = h.Hotelid 
        WHERE 1=1
    `;
    let params = [];
    
    if (user.role_level === 'hotel_admin') {
        if (user.userid) {
            query += ' AND o.created_by_id = ?';
            params.push(user.userid);
        }
    } else if (user.role_level === 'brand_admin') {
        if (user.brand_id) {
            query += ' AND o.brand_id = ?';
            params.push(user.brand_id);
        }
    } else if (user.role_level === 'superadmin') {
        // No filter
    } else {
        if (user.userid) {
            query += ' AND o.created_by_id = ?';
            params.push(user.userid);
        }
    }
    
    query += ' ORDER BY o.created_date DESC';
    
    console.log('Final query:', query);
    console.log('Query params:', params);
    
    const filteredOutlets = db.prepare(query).all(...params);
    console.log('\n=== Filtered outlets ===');
    console.log('Filtered outlets count:', filteredOutlets.length);
    filteredOutlets.forEach(outlet => {
        console.log(`Outlet ID: ${outlet.outletid}, Name: ${outlet.outlet_name}, Created by: ${outlet.created_by_id}`);
    });
    
} catch (error) {
    console.error('Error:', error);
} finally {
    db.close();
} 