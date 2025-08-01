const path = require('path');
const Database = require('better-sqlite3');

// Connect to the database
const db = new Database(path.join('F:','dbresto', 'miresto.db'));

console.log('Starting foreign key constraint fix...');

try {
    // First, let's check what tables exist and their structure
    console.log('\n=== Checking current table structure ===');
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in database:', tables.map(t => t.name));
    
    // Check the mst_users table structure
    const userTableInfo = db.prepare("PRAGMA table_info(mst_users)").all();
    console.log('\n=== mst_users table structure ===');
    userTableInfo.forEach(col => {
        console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check foreign key constraints
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(mst_users)").all();
    console.log('\n=== Current foreign key constraints ===');
    foreignKeys.forEach(fk => {
        console.log(`FK: ${fk.from} -> ${fk.table}.${fk.to}`);
    });
    
    // Check if HotelMasters table exists and has data
    const hotelMastersExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='HotelMasters'").get();
    console.log('\n=== HotelMasters table check ===');
    console.log('HotelMasters table exists:', !!hotelMastersExists);
    
    if (hotelMastersExists) {
        const hotelCount = db.prepare("SELECT COUNT(*) as count FROM HotelMasters").get();
        console.log('Number of hotels in HotelMasters:', hotelCount.count);
        
        const hotels = db.prepare("SELECT Hotelid, hotel_name FROM HotelMasters LIMIT 5").all();
        console.log('Sample hotels:', hotels);
    }
    
    // Check if there are any existing users
    const userCount = db.prepare("SELECT COUNT(*) as count FROM mst_users").get();
    console.log('\n=== Current users ===');
    console.log('Number of users in mst_users:', userCount.count);
    
    if (userCount.count > 0) {
        const users = db.prepare("SELECT userid, username, role_level, brand_id, hotel_id FROM mst_users LIMIT 5").all();
        console.log('Sample users:', users);
    }
    
    // Now let's fix the foreign key constraints
    console.log('\n=== Fixing foreign key constraints ===');
    
    // Drop the existing mst_users table
    console.log('Dropping existing mst_users table...');
    db.prepare("DROP TABLE IF EXISTS mst_users").run();
    
    // Recreate the mst_users table with correct foreign key constraints
    console.log('Recreating mst_users table with correct constraints...');
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
    
    // Recreate the superadmin user
    console.log('Recreating superadmin user...');
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
    
    console.log('Superadmin user created with ID:', db.prepare("SELECT last_insert_rowid()").get()['last_insert_rowid()']);
    
    // Verify the fix
    console.log('\n=== Verification ===');
    const newUserCount = db.prepare("SELECT COUNT(*) as count FROM mst_users").get();
    console.log('Users after fix:', newUserCount.count);
    
    const superadmin = db.prepare("SELECT userid, username, role_level FROM mst_users WHERE username = 'admin'").get();
    console.log('Superadmin user:', superadmin);
    
    console.log('\n=== Foreign key fix completed successfully! ===');
    console.log('You can now create users without foreign key constraint errors.');
    
} catch (error) {
    console.error('Error during foreign key fix:', error);
} finally {
    db.close();
} 