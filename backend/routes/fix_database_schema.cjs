const db = require('./config/db');

console.log('🔧 Fixing Database Schema...\n');

try {
    // First, let's backup existing users data
    console.log('📋 Backing up existing users...');
    const existingUsers = db.prepare('SELECT * FROM mst_users').all();
    console.log(`Found ${existingUsers.length} existing users`);

    // Drop the existing mst_users table
    console.log('🗑️ Dropping existing mst_users table...');
    db.prepare('DROP TABLE IF EXISTS mst_users').run();

    // Recreate the mst_users table with correct foreign key references
    console.log('🏗️ Creating new mst_users table with correct foreign keys...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS mst_users (
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

    // Recreate the mst_user_permissions table
    console.log('🔐 Creating mst_user_permissions table...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS mst_user_permissions (
            permissionid INTEGER PRIMARY KEY AUTOINCREMENT,
            userid INTEGER NOT NULL,
            module_name TEXT NOT NULL,
            can_view INTEGER DEFAULT 0,
            can_create INTEGER DEFAULT 0,
            can_edit INTEGER DEFAULT 0,
            can_delete INTEGER DEFAULT 0,
            created_by_id INTEGER,
            created_date DATETIME,
            FOREIGN KEY (userid) REFERENCES mst_users(userid)
        )
    `).run();

    // Recreate the SuperAdmin user
    console.log('👑 Creating SuperAdmin user...');
    const bcrypt = require('bcrypt');
    
    async function createSuperAdmin() {
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        
        const stmt = db.prepare(`
            INSERT INTO mst_users (
                username, email, password, full_name, role_level, 
                is_active, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        const result = stmt.run(
            'superadmin',
            'superadmin@miracle.com',
            hashedPassword,
            'Super Administrator',
            'superadmin',
            1
        );

        console.log('✅ SuperAdmin created with ID:', result.lastInsertRowid);

        // Create default permissions for SuperAdmin
        const defaultPermissions = {
            'orders': { view: 1, create: 1, edit: 1, delete: 1 },
            'customers': { view: 1, create: 1, edit: 1, delete: 1 },
            'menu': { view: 1, create: 1, edit: 1, delete: 1 },
            'reports': { view: 1, create: 1, edit: 1, delete: 1 },
            'users': { view: 1, create: 1, edit: 1, delete: 1 },
            'settings': { view: 1, create: 1, edit: 1, delete: 1 }
        };

        const permStmt = db.prepare(`
            INSERT INTO mst_user_permissions (
                userid, module_name, can_view, can_create, can_edit, can_delete, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        Object.entries(defaultPermissions).forEach(([module, perms]) => {
            permStmt.run(
                result.lastInsertRowid,
                module,
                perms.view ? 1 : 0,
                perms.create ? 1 : 0,
                perms.edit ? 1 : 0,
                perms.delete ? 1 : 0,
                result.lastInsertRowid
            );
        });

        console.log('✅ SuperAdmin permissions created');
    }

    await createSuperAdmin();

    // Restore other users if they existed
    if (existingUsers.length > 1) {
        console.log('🔄 Restoring other users...');
        const insertStmt = db.prepare(`
            INSERT INTO mst_users (
                username, email, password, full_name, phone, role_level,
                parent_user_id, brand_id, hotel_id, outlet_id, is_active,
                last_login, created_by_id, created_date, updated_by_id, updated_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        existingUsers.forEach(user => {
            if (user.role_level !== 'superadmin') {
                try {
                    insertStmt.run(
                        user.username,
                        user.email,
                        user.password,
                        user.full_name,
                        user.phone,
                        user.role_level,
                        user.parent_user_id,
                        user.brand_id,
                        user.hotel_id,
                        user.outlet_id,
                        user.is_active,
                        user.last_login,
                        user.created_by_id,
                        user.created_date,
                        user.updated_by_id,
                        user.updated_date
                    );
                    console.log(`✅ Restored user: ${user.username}`);
                } catch (error) {
                    console.log(`⚠️ Could not restore user ${user.username}:`, error.message);
                }
            }
        });
    }

    console.log('\n✅ Database schema fixed successfully!');
    console.log('🔑 SuperAdmin credentials:');
    console.log('   Email: superadmin@miracle.com');
    console.log('   Password: superadmin123');

} catch (error) {
    console.error('❌ Error fixing database schema:', error);
} finally {
    db.close();
} 