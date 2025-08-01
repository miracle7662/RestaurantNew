import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'config', 'miresto.db');
const db = new Database(dbPath);

console.log('🔍 Checking foreign key constraints...\n');

try {
    // Check foreign key constraints
    const constraints = db.prepare(`
        SELECT 
            m.tbl_name as table_name,
            m.sql as table_sql
        FROM sqlite_master m
        WHERE m.type = 'table' AND m.tbl_name = 'mst_users'
    `).get();

    console.log('Table SQL for mst_users:');
    console.log(constraints.table_sql);

    // Check if foreign keys are enabled
    const fkEnabled = db.prepare('PRAGMA foreign_keys').get();
    console.log('\nForeign keys enabled:', fkEnabled.foreign_keys);

} catch (error) {
    console.error('❌ Error checking constraints:', error);
} finally {
    db.close();
} 