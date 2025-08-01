const db = require('../config/db');

// Migration to add outlet user specific columns to mst_users table
const addOutletUserColumns = () => {
  try {
    console.log('Starting migration: Adding outlet user columns to mst_users table...');
    
    // Add columns if they don't exist
    const columns = [
      'outletid INTEGER',
      'designation TEXT',
      'user_type TEXT',
      'shift_time TEXT',
      'mac_address TEXT',
      'assign_warehouse TEXT',
      'language_preference TEXT DEFAULT "English"',
      'address TEXT',
      'city TEXT',
      'sub_locality TEXT',
      'web_access INTEGER DEFAULT 0',
      'self_order INTEGER DEFAULT 1',
      'captain_app INTEGER DEFAULT 1',
      'kds_app INTEGER DEFAULT 1',
      'captain_old_kot_access TEXT DEFAULT "Enabled"',
      'verify_mac_ip INTEGER DEFAULT 0'
    ];
    
    columns.forEach(column => {
      try {
        const columnName = column.split(' ')[0];
        console.log(`Adding column: ${columnName}`);
        db.exec(`ALTER TABLE mst_users ADD COLUMN ${column}`);
        console.log(`Successfully added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.error(`Error adding column ${column.split(' ')[0]}:`, error.message);
        }
      }
    });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
addOutletUserColumns();