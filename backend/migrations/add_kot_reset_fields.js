const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as in db.js
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

try {
  console.log('Adding KOT reset fields to mstoutlet_settings...');

  // Add next_reset_kot_days column
  db.exec(`
    ALTER TABLE mstoutlet_settings
    ADD COLUMN next_reset_kot_days TEXT DEFAULT 'DAILY';
  `);

  // Add next_reset_kot_date column
  db.exec(`
    ALTER TABLE mstoutlet_settings
    ADD COLUMN next_reset_kot_date DATETIME;
  `);

  console.log('Migration completed successfully.');
} catch (error) {
  console.error('Migration failed:', error.message);
} finally {
  db.close();
}
