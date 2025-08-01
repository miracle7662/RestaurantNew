const path = require('path');
const Database = require('better-sqlite3');

// Connect to the database
const db = new Database(path.join('F:','dbresto', 'miresto.db'));

console.log('Starting simple foreign key fix...');

try {
    // Disable foreign key constraints temporarily
    db.prepare("PRAGMA foreign_keys = OFF").run();
    
    console.log('\n=== Current state ===');
    const hotels = db.prepare("SELECT Hotelid, hotel_name FROM HotelMasters").all();
    console.log('Hotels:', hotels);
    
    const users = db.prepare("SELECT userid, username, role_level, brand_id, hotel_id FROM mst_users").all();
    console.log('Current users:', users);
    
    // Drop the mst_users table completely
    console.log('\n=== Dropping mst_users table ===');
    db.prepare("DROP TABLE IF EXISTS mst_users").run();
    
    // Recreate the table with correct foreign key constraints
    console.log('=== Recreating mst_users table ===');
    db.prepare(`
        CREATE TABLE mst_users (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role_level TEXT NOT NULL,
            parent_user_id INTEGER,
            brand_id INTEGER,
            hotel_id INTEGER,
            outlet_id INTEGER,
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_by_id INTEGER,
            created_date DATETIME,
            updated_by_id INTEGER,
            updated_date DATETIME,
            FOREIGN KEY (parent_user_id) REFERENCES mst_users(userid),
            FOREIGN KEY (brand_id) REFERENCES HotelMasters(Hotelid),
            FOREIGN KEY (hotel_id) REFERENCES HotelMasters(Hotelid)
        )
    `).run();
    
    // Create a new superadmin user
    console.log('=== Creating superadmin user ===');
    const bcrypt = require('bcrypt');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`
        INSERT INTO mst_users (
            username, email, password, full_name, phone, role_level,
            parent_user_id, brand_id, hotel_id, created_by_id, created_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
        'admin', 'admin@miresto.com', hashedPassword, 'Super Admin', '1234567890',
        'superadmin', null, null, null, null
    );
    
    const superadminId = db.prepare("SELECT last_insert_rowid()").get()['last_insert_rowid()'];
    console.log('Superadmin created with ID:', superadminId);
    
    // Re-enable foreign key constraints
    db.prepare("PRAGMA foreign_keys = ON").run();
    
    // Verify the fix
    console.log('\n=== Verification ===');
    const newUsers = db.prepare("SELECT userid, username, role_level, brand_id, hotel_id FROM mst_users").all();
    console.log('Users after fix:', newUsers);
    
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(mst_users)").all();
    console.log('Foreign key constraints:');
    foreignKeys.forEach(fk => {
        console.log(`FK: ${fk.from} -> ${fk.table}.${fk.to}`);
    });
    
    console.log('\n=== Fix completed successfully! ===');
    console.log('You can now create users with the following credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: superadmin');
    
} catch (error) {
    console.error('Error during fix:', error);
} finally {
    db.close();
} 