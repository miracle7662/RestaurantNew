import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'config', 'miresto.db');
const db = new Database(dbPath);

console.log('🔧 Setting up database schema...\n');

try {
    // Create mst_users table
    console.log('Creating mst_users table...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS mst_users (
            userid INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE,
            email VARCHAR(100) UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20),
            role_level VARCHAR(20) NOT NULL,
            brand_id INTEGER,
            hotel_id INTEGER,
            parent_user_id INTEGER,
            is_active INTEGER DEFAULT 1,
            last_login DATETIME,
            created_by_id INTEGER,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by_id INTEGER,
            updated_date DATETIME
        )
    `).run();

    // Create mst_user_permissions table
    console.log('Creating mst_user_permissions table...');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS mst_user_permissions (
            permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
            userid INTEGER NOT NULL,
            module_name VARCHAR(50) NOT NULL,
            can_view INTEGER DEFAULT 0,
            can_create INTEGER DEFAULT 0,
            can_edit INTEGER DEFAULT 0,
            can_delete INTEGER DEFAULT 0,
            created_by_id INTEGER,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by_id INTEGER,
            updated_date DATETIME
        )
    `).run();

    console.log('✅ Database schema created successfully!\n');

    // Check if SuperAdmin exists
    const existingSuperAdmin = db.prepare('SELECT userid FROM mst_users WHERE role_level = ?').get('superadmin');
    
    if (!existingSuperAdmin) {
        console.log('Creating initial SuperAdmin...');
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

        console.log('✅ Initial SuperAdmin created successfully');
        console.log('📧 Email: superadmin@miracle.com');
        console.log('🔑 Password: superadmin123');
    } else {
        console.log('ℹ️ SuperAdmin already exists');
    }

    // Check if there are any hotel admin users
    const hotelAdmins = db.prepare('SELECT COUNT(*) as count FROM mst_users WHERE role_level = ?').get('hotel_admin');
    console.log(`\n🏨 Hotel Admin users: ${hotelAdmins.count}`);

    if (hotelAdmins.count === 0) {
        console.log('💡 No hotel admin users found. You can create them through the frontend.');
    }

} catch (error) {
    console.error('❌ Error setting up database:', error);
} finally {
    db.close();
} 