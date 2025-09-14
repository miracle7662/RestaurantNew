const db = require('../config/db');

console.log('🔧 Adding KOTNo fields to tables...\n');

try {
  // Add KOTNo to TAxnTrnbill
  db.prepare(`ALTER TABLE TAxnTrnbill ADD COLUMN KOTNo INTEGER DEFAULT NULL`).run();
  console.log('✅ Added KOTNo to TAxnTrnbill');

  // Add KOTNo to TAxnTrnbilldetails
  db.prepare(`ALTER TABLE TAxnTrnbilldetails ADD COLUMN KOTNo INTEGER DEFAULT NULL`).run();
  console.log('✅ Added KOTNo to TAxnTrnbilldetails');

  // Create RevKOT table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS RevKOT (
      RevKOTID INTEGER PRIMARY KEY AUTOINCREMENT,
      TxnID INTEGER,
      TXnDetailID INTEGER,
      ItemID INTEGER,
      CancelQty INTEGER,
      KOTNo INTEGER,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (TxnID) REFERENCES TAxnTrnbill(TxnID),
      FOREIGN KEY (TXnDetailID) REFERENCES TAxnTrnbilldetails(TXnDetailID)
    )
  `).run();
  console.log('✅ Created RevKOT table');

} catch (error) {
  console.error('❌ Error adding KOT fields:', error);
} finally {
  db.close();
}
