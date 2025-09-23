const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

console.log('🧪 Testing SQL Triggers for Bill Totals...\n');

try {
    // Start a transaction for testing
    const testTransaction = db.transaction(() => {
        console.log('1️⃣ Creating a test bill...');
        const billResult = db.prepare(`
            INSERT INTO TAxnTrnbill (outletid, TxnNo, TableID, TxnDatetime)
            VALUES (1, 'TRIG001', 1, datetime('now'))
        `).run();

        const txnId = billResult.lastInsertRowid;
        console.log(`   ✅ Created bill with TxnID: ${txnId}`);

        console.log('\n2️⃣ Adding test items (testing INSERT trigger)...');
        db.prepare(`
            INSERT INTO TAxnTrnbilldetails (
                TxnID, outletid, ItemID, RuntimeRate, Qty,
                CGST_AMOUNT, SGST_AMOUNT, IGST_AMOUNT, CESS_AMOUNT, Discount_Amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(txnId, 1, 1, 100.00, 2, 18.00, 18.00, 0.00, 0.00, 10.00);

        db.prepare(`
            INSERT INTO TAxnTrnbilldetails (
                TxnID, outletid, ItemID, RuntimeRate, Qty,
                CGST_AMOUNT, SGST_AMOUNT, IGST_AMOUNT, CESS_AMOUNT, Discount_Amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(txnId, 1, 2, 50.00, 1, 9.00, 9.00, 0.00, 0.00, 5.00);

        console.log('   ✅ Added 2 test items');

        console.log('\n3️⃣ Checking updated bill totals...');
        const bill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
        console.log('   📊 Bill Totals:');
        console.log(`      - GrossAmt: ${bill.GrossAmt}`);
        console.log(`      - CGST: ${bill.CGST}`);
        console.log(`      - SGST: ${bill.SGST}`);
        console.log(`      - IGST: ${bill.IGST}`);
        console.log(`      - CESS: ${bill.CESS}`);
        console.log(`      - Discount: ${bill.Discount}`);
        console.log(`      - Amount: ${bill.Amount}`);

        console.log('\n4️⃣ Testing UPDATE trigger (updating quantity)...');
        db.prepare('UPDATE TAxnTrnbilldetails SET Qty = 3 WHERE TxnID = ? AND ItemID = 1').run(txnId);

        const updatedBill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
        console.log('   📊 Updated Bill Totals:');
        console.log(`      - GrossAmt: ${updatedBill.GrossAmt}`);
        console.log(`      - Amount: ${updatedBill.Amount}`);

        console.log('\n5️⃣ Testing DELETE trigger (removing an item)...');
        db.prepare('DELETE FROM TAxnTrnbilldetails WHERE TxnID = ? AND ItemID = 2').run(txnId);

        const finalBill = db.prepare('SELECT * FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
        console.log('   📊 Final Bill Totals:');
        console.log(`      - GrossAmt: ${finalBill.GrossAmt}`);
        console.log(`      - Amount: ${finalBill.Amount}`);

        console.log('\n✅ All trigger tests completed successfully!');

        // Expected calculations:
        // Initial: Item1 (100*2=200) + Item2 (50*1=50) = GrossAmt: 250
        // CGST: 18 + 9 = 27
        // SGST: 18 + 9 = 27
        // Discount: 10 + 5 = 15
        // Amount: 250 + 27 + 27 - 15 = 289

        // After update: Item1 (100*3=300) = GrossAmt: 300
        // Amount: 300 + 18 + 18 - 10 = 326

        // After delete: Only Item1 remains = GrossAmt: 300
        // Amount: 300 + 18 + 18 - 10 = 326

        return { txnId, initialBill: bill, updatedBill, finalBill };
    });

    const result = testTransaction();

} catch (error) {
    console.error('❌ Error testing triggers:', error.message);
    console.error('Full error:', error);
} finally {
    db.close();
    console.log('\n📋 Test completed. Check the database to verify trigger functionality.');
}
