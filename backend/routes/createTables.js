import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'config', 'miresto.db');
const db = new Database(dbPath);

console.log('🔧 Creating basic tables...\n');

try {
    // Create mst_users table (without foreign keys)
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

    // Create mst_user_permissions table (without foreign keys)
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

    console.log('✅ Tables created successfully!');

} catch (error) {
    console.error('❌ Error creating tables:', error);
} finally {
    db.close();
} 