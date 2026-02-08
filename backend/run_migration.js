const db = require('./config/db');
const migration = require('./migrations/add_kitchenmaingroupid_to_mstkitchencategory.js');
migration.up(db);
console.log('Migration applied successfully');
