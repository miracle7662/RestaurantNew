const path = require('path');
const Database = require('better-sqlite3');

console.log('Starting debug...');

try {
    // Connect to the database
    const db = new Database(path.join('F:','dbresto', 'miresto.db'));
    console.log('Database connected successfully');
    
    // Check if mst_users table exists
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mst_users'").get();
    console.log('mst_users table exists:', !!tables);
    
    if (tables) {
        // Check all users
        const users = db.prepare("SELECT userid, username, role_level, hotel_id, brand_id FROM mst_users").all();
        console.log('All users:', users);
        
        // Check specific user "ads"
        const userAds = db.prepare("SELECT * FROM mst_users WHERE username = 'ads'").get();
        console.log('User "ads":', userAds);
        
        // Check all outlets
        const outlets = db.prepare("SELECT outletid, outlet_name, created_by_id FROM mst_outlets").all();
        console.log('All outlets:', outlets);
    }
    
    db.close();
} catch (error) {
    console.error('Error:', error);
} 