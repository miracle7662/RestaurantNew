const db = require('../config/db');

// Migration to add NCName and NCPurpose fields to TAxnTrnbill table
console.log('Starting migration to add NCName and NCPurpose fields...');

// Add NCName column
try {
  db.prepare(`ALTER TABLE TAxnTrnbill ADD COLUMN NCName TEXT DEFAULT NULL`).run();
  console.log('✅ Added NCName to TAxnTrnbill');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ NCName column already exists');
  } else {
    console.error('Error adding NCName:', error);
  }
}

// Add NCPurpose column
try {
  db.prepare(`ALTER TABLE TAxnTrnbill ADD COLUMN NCPurpose TEXT DEFAULT NULL`).run();
  console.log('✅ Added NCPurpose to TAxnTrnbill');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ NCPurpose column already exists');
  } else {
    console.error('Error adding NCPurpose:', error);
  }
}

console.log('Migration completed successfully!');
