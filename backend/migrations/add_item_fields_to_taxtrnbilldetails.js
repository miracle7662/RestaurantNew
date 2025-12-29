const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as in db.js
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

try {
  console.log('Adding item_no and item_name fields to TAxnTrnbilldetails table...');

  // Add item_no column
  db.exec(`
    ALTER TABLE TAxnTrnbilldetails
    ADD COLUMN item_no TEXT;
  `);

  // Add item_name column
  db.exec(`
    ALTER TABLE TAxnTrnbilldetails
    ADD COLUMN item_name TEXT;
  `);

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  db.close();
}
