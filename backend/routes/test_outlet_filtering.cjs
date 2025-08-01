const path = require('path');
const Database = require('better-sqlite3');

console.log('Testing outlet filtering for user "ads"...');

try {
    const db = new Database(path.join('F:','dbresto', 'miresto.db'));
    
    // Get user "ads" details
    const user = db.prepare("SELECT * FROM mst_users WHERE username = 'ads'").get();
    console.log('\n=== User "ads" details ===');
    console.log('User ID:', user.userid);
    console.log('Role:', user.role_level);
    console.log('Brand ID:', user.brand_id);
    console.log('Hotel ID:', user.hotel_id);
    
    // Test the filtering logic
    const role_level = user.role_level;
    const brand_id = user.brand_id;
    const created_by_id = user.userid;
    
    let query = `
        SELECT o.*, h.hotel_name as brand_name 
        FROM mst_outlets o 
        LEFT JOIN HotelMasters h ON o.brand_id = h.Hotelid 
        WHERE 1=1
    `;
    let params = [];
    
    console.log('\n=== Applying filters ===');
    
    if (role_level === 'hotel_admin') {
        console.log('User is hotel_admin, applying brand_id and created_by_id filters');
        if (brand_id) {
            query += ' AND o.brand_id = ?';
            params.push(brand_id);
            console.log('Added brand_id filter:', brand_id);
        }
        if (created_by_id) {
            query += ' AND o.created_by_id = ?';
            params.push(created_by_id);
            console.log('Added created_by_id filter:', created_by_id);
        }
    }
    
    query += ' ORDER BY o.created_date DESC';
    
    console.log('\n=== Final query ===');
    console.log('Query:', query);
    console.log('Params:', params);
    
    const filteredOutlets = db.prepare(query).all(...params);
    console.log('\n=== Filtered results ===');
    console.log('Found outlets:', filteredOutlets.length);
    filteredOutlets.forEach(outlet => {
        console.log(`- Outlet ID: ${outlet.outletid}, Name: ${outlet.outlet_name}, Brand: ${outlet.brand_name}, Created by: ${outlet.created_by_id}`);
    });
    
    // Show all outlets for comparison
    const allOutlets = db.prepare("SELECT o.*, h.hotel_name as brand_name FROM mst_outlets o LEFT JOIN HotelMasters h ON o.brand_id = h.Hotelid").all();
    console.log('\n=== All outlets for comparison ===');
    console.log('Total outlets:', allOutlets.length);
    allOutlets.forEach(outlet => {
        console.log(`- Outlet ID: ${outlet.outletid}, Name: ${outlet.outlet_name}, Brand: ${outlet.brand_name}, Created by: ${outlet.created_by_id}`);
    });
    
    db.close();
} catch (error) {
    console.error('Error:', error);
} 