const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as in db.js
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

try {
  console.log('Adding DeptID field to TAxnTrnbill table...');

  // Add DeptID column
  db.exec(`
    ALTER TABLE TAxnTrnbill
    ADD COLUMN DeptID INTEGER;
  `);

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  db.close();
}