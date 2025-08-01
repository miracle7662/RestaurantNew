import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'config', 'miresto.db');
const db = new Database(dbPath);

console.log('🔍 Checking database tables...\n');

try {
    // Get all table names
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    `).all();

    console.log(`Found ${tables.length} tables:\n`);
    
    tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name}`);
    });

    // Check if mst_users table exists
    const usersTable = tables.find(t => t.name === 'mst_users');
    if (!usersTable) {
        console.log('\n❌ mst_users table does not exist!');
        console.log('The database schema needs to be created.');
    } else {
        console.log('\n✅ mst_users table exists');
    }

} catch (error) {
    console.error('❌ Error checking tables:', error);
} finally {
    db.close();
} 