const db = require('./backend/config/db');

// Test script to verify quantity aggregation fix
async function testQuantityAggregation() {
  try {
    console.log('Testing quantity aggregation fix...\n');
    
    // Test the fixed query for a specific table
    const testTableId = 1; // Change this to an actual table ID in your database
    
    console.log(`Testing getUnbilledItemsByTable for TableID: ${testTableId}`);
    
    const rows = db.prepare(`
      SELECT
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        SUM(d.Qty) as Qty,
        d.RuntimeRate as price,
        MAX(b.isBilled) as isBilled,
        MAX(d.isNCKOT) as isNCKOT,
        MAX(b.NCName) as NCName,
        MAX(b.NCPurpose) as NCPurpose
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate
      HAVING SUM(d.Qty) > 0
    `).all(testTableId);
    
    console.log('Results:');
    console.log(JSON.stringify(rows, null, 2));
    
    // Also test the old query to show the difference
    console.log('\n--- Old Query Results (for comparison) ---');
    const oldRows = db.prepare(`
      SELECT
        d.ItemID,
        COALESCE(m.item_name, 'Unknown Item') AS ItemName,
        SUM(d.Qty) as Qty,
        d.RuntimeRate as price,
        b.isBilled,
        d.isNCKOT,
        b.NCName,
        b.NCPurpose
      FROM TAxnTrnbilldetails d
      JOIN TAxnTrnbill b ON d.TxnID = b.TxnID
      LEFT JOIN mstrestmenu m ON d.ItemID = m.restitemid
      WHERE b.TableID = ? AND b.isBilled = 0 AND d.isCancelled = 0
      GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate, b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose
    `).all(testTableId);
    
    console.log('Old Results:');
    console.log(JSON.stringify(oldRows, null, 2));
    
    console.log('\n--- Summary ---');
    console.log(`New query returned ${rows.length} unique items`);
    console.log(`Old query returned ${oldRows.length} items (potentially duplicated)`);
    
    if (rows.length < oldRows.length) {
      console.log('✅ Fix successful: Quantities are now properly aggregated!');
    } else {
      console.log('ℹ️  No duplication found for this table, but fix is in place for future cases.');
    }
    
  } catch (error) {
    console.error('Error testing quantity aggregation:', error.message);
  }
}

// Run the test
testQuantityAggregation();



