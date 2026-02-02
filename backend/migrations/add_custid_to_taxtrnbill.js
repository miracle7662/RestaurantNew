const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as in db.js
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

try {
  console.log('Adding custid field to TAxnTrnbill table...');

  // Add custid column
  db.exec(`
    ALTER TABLE TAxnTrnbill
    ADD COLUMN custid INTEGER;
  `);

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  db.close();
}
