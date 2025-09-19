const db = require('../config/db');

console.log('🔧 Adding Discount_Amount field to TAxnTrnbilldetails...\n');

try {
  // Add Discount_Amount to TAxnTrnbilldetails
  db.prepare(`ALTER TABLE TAxnTrnbilldetails ADD COLUMN Discount_Amount REAL DEFAULT 0`).run();
  console.log('✅ Added Discount_Amount to TAxnTrnbilldetails');
} catch (error) {
  console.error('❌ Error adding Discount_Amount:', error);
} finally {
  db.close();
}
