const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as in db.js
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

try {
  console.log('Adding order_tag field to TAxnTrnbilldetails table...');

  // Add order_tag column
  db.exec(`
    ALTER TABLE TAxnTrnbilldetails
    ADD COLUMN order_tag TEXT;
  `);

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  db.close();
}
