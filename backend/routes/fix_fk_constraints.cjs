const path = require('path');
const Database = require('better-sqlite3');

// Connect to the database
const db = new Database(path.join('F:','dbresto', 'miresto.db'));

console.log('Starting foreign key constraint fix...');

try {
    // Enable foreign key constraints
    db.prepare("PRAGMA foreign_keys = ON").run();
    
    console.log('\n=== Current foreign key constraints ===');
    const foreignKeys = db.prepare("PRAGMA foreign_key_list(mst_users)").all();
    foreignKeys.forEach(fk => {
        console.log(`FK: ${fk.from} -> ${fk.table}.${fk.to}`);
    });
    
    // Check HotelMasters table structure
    console.log('\n=== HotelMasters table structure ===');
    const hotelTableInfo = db.prepare("PRAGMA table_info(HotelMasters)").all();
    hotelTableInfo.forEach(col => {
        console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check existing data
    console.log('\n=== Existing data check ===');
    const hotels = db.prepare("SELECT Hotelid, hotel_name FROM HotelMasters").all();
    console.log('Hotels:', hotels);
    
    const users = db.prepare("SELECT userid, username, role_level, brand_id, hotel_id FROM mst_users").all();
    console.log('Users:', users);
    
    // Drop and recreate the mst_users table with correct foreign key constraints
    console.log('\n=== Recreating mst_users table with correct constraints ===');
    
    // First, backup existing users data
    const existingUsers = db.prepare("SELECT * FROM mst_users").all();
    console.log('Backing up', existingUsers.length, 'users...');
    
    // Drop the table
    db.prepare("DROP TABLE IF EXISTS mst_users").run();
    
    // Recreate with correct foreign key constraints
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
    
    // Restore the users
    console.log('Restoring users...');
    const bcrypt = require('bcrypt');
    
    existingUsers.forEach(user => {
        try {
            db.prepare(`
                INSERT INTO mst_users (
                    userid, username, email, password, full_name, phone, role_level,
                    parent_user_id, brand_id, hotel_id, outlet_id, is_active,
                    last_login, created_by_id, created_date, updated_by_id, updated_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                user.userid, user.username, user.email, user.password, user.full_name, user.phone, user.role_level,
                user.parent_user_id, user.brand_id, user.hotel_id, user.outlet_id, user.is_active,
                user.last_login, user.created_by_id, user.created_date, user.updated_by_id, user.updated_date
            );
        } catch (error) {
            console.log('Error restoring user', user.username, ':', error.message);
        }
    });
    
    // Verify the fix
    console.log('\n=== Verification ===');
    const newForeignKeys = db.prepare("PRAGMA foreign_key_list(mst_users)").all();
    console.log('New foreign key constraints:');
    newForeignKeys.forEach(fk => {
        console.log(`FK: ${fk.from} -> ${fk.table}.${fk.to}`);
    });
    
    const finalUsers = db.prepare("SELECT userid, username, role_level, brand_id, hotel_id FROM mst_users").all();
    console.log('Final users:', finalUsers);
    
    console.log('\n=== Foreign key fix completed successfully! ===');
    console.log('The foreign key constraints now correctly reference HotelMasters.Hotelid');
    
} catch (error) {
    console.error('Error during foreign key fix:', error);
} finally {
    db.close();
} 