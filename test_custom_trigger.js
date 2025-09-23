const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join('D:', 'Restaurant_Database', 'miresto.db');
const db = new Database(dbPath);

console.log('🧪 Testing YOUR Custom Trigger (trg_update_bill_amount_after_insert)...\n');

try {
    // Start a transaction for testing
    const testTransaction = db.transaction(() => {
        console.log('1️⃣ Creating a test bill...');
        const billResult = db.prepare(`
            INSERT INTO TAxnTrnbill (outletid, TxnNo, TableID, TxnDatetime)
            VALUES (1, 'CUSTOM_TRIGGER_TEST', 1, datetime('now'))
        `).run();

        const txnId = billResult.lastInsertRowid;
        console.log(`   ✅ Created bill with TxnID: ${txnId}`);

        console.log('\n2️⃣ Adding test items (testing YOUR INSERT trigger)...');
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

        console.log('\n3️⃣ Checking updated bill totals (using YOUR trigger)...');
        const bill = db.prepare('SELECT GrossAmt, Discount, Amount FROM TAxnTrnbill WHERE TxnID = ?').get(txnId);
        console.log('   📊 Bill Totals (from YOUR trigger):');
        console.log(`      - GrossAmt: ${bill.GrossAmt}`);
        console.log(`      - Discount: ${bill.Discount}`);
        console.log(`      - Amount: ${bill.Amount}`);

        // Expected calculations for YOUR trigger:
        // GrossAmt: (100*2) + (50*1) = 200 + 50 = 250
        // Discount: 10 + 5 = 15
        // Amount: (200 - 10 + 18 + 18) + (50 - 5 + 9 + 9) = (226) + (63) = 289

        const expectedGross = 250;
        const expectedDiscount = 15;
        const expectedAmount = 289;

        console.log('\n4️⃣ Verifying calculations...');
        console.log(`   Expected GrossAmt: ${expectedGross}, Actual: ${bill.GrossAmt} ${bill.GrossAmt === expectedGross ? '✅' : '❌'}`);
        console.log(`   Expected Discount: ${expectedDiscount}, Actual: ${bill.Discount} ${bill.Discount === expectedDiscount ? '✅' : '❌'}`);
        console.log(`   Expected Amount: ${expectedAmount}, Actual: ${bill.Amount} ${bill.Amount === expectedAmount ? '✅' : '❌'}`);

        if (bill.GrossAmt === expectedGross && bill.Discount === expectedDiscount && bill.Amount === expectedAmount) {
            console.log('\n🎉 SUCCESS: Your custom trigger is working perfectly!');
        } else {
            console.log('\n⚠️  WARNING: There might be a discrepancy in calculations.');
        }

        return { txnId, bill };
    });

    const result = testTransaction();

} catch (error) {
    console.error('❌ Error testing your custom trigger:', error.message);
    console.error('Full error:', error);
} finally {
    db.close();
    console.log('\n📋 Test completed.');
    console.log('Your custom trigger (trg_update_bill_amount_after_insert) has been tested.');
    console.log('It should automatically update GrossAmt, Discount, and Amount when new items are added.');
}
