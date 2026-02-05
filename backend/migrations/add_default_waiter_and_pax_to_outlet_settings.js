const db = require('../config/db');

const migration = {
  up: () => {
    // Add default_waiter_id column (assuming it's an integer, possibly foreign key)
    db.exec(`
      ALTER TABLE mstoutlet_settings
      ADD COLUMN default_waiter_id INTEGER DEFAULT NULL;
    `);

    // Add enable_pax column (boolean, 0 or 1)
    db.exec(`
      ALTER TABLE mstoutlet_settings
      ADD COLUMN enable_pax INTEGER DEFAULT 0;
    `);

    console.log('Migration: Added default_waiter_id and enable_pax to mstoutlet_settings');
  },

  down: () => {
    // Remove the columns if rolling back
    db.exec(`
      ALTER TABLE mstoutlet_settings
      DROP COLUMN default_waiter_id;
    `);

    db.exec(`
      ALTER TABLE mstoutlet_settings
      DROP COLUMN enable_pax;
    `);

    console.log('Rollback: Removed default_waiter_id and enable_pax from mstoutlet_settings');
  }
};

module.exports = migration;
