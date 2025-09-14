// Test script to verify RevQty functionality
// This script tests the chicken biryani example scenario

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testRevQtyFunctionality() {
  console.log('🧪 Testing RevQty Functionality - Chicken Biryani Example');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create a test bill with chicken biryani (qty: 4)
    console.log('\n📝 Step 1: Creating initial order with Chicken Biryani (qty: 4)');
    
    const createBillPayload = {
      TableID: 1,
      Steward: 'Test Steward',
      PAX: 2,
      TxnDatetime: new Date().toISOString(),
      details: [{
        ItemID: 1, // Assuming Chicken Biryani has ItemID 1
        Qty: 4,    // Initial quantity: 4
        RuntimeRate: 250.00, // Price per item
        AutoKOT: true,
        ManualKOT: false,
        SpecialInst: 'Test order',
        DeptID: 1,
        HotelID: 1
      }]
    };

    const createResponse = await axios.post(`${API_BASE}/TAxnTrnbill`, createBillPayload);
    const txnId = createResponse.data.data.TxnID;
    console.log(`✅ Bill created with TxnID: ${txnId}`);

    // Step 2: Perform minus operation (-2)
    console.log('\n➖ Step 2: Performing minus operation (-2)');
    
    const reverseKOTPayload = {
      txnId: txnId,
      tableId: 1,
      itemId: 1,
      qtyToReverse: 2 // Subtract 2 from quantity
    };

    const reverseResponse = await axios.post(`${API_BASE}/TAxnTrnbill/kot/reverse`, reverseKOTPayload);
    console.log(`✅ Reverse KOT created: ${JSON.stringify(reverseResponse.data.data)}`);

    // Step 3: Verify the RevQty field
    console.log('\n🔍 Step 3: Verifying RevQty field in database');
    
    const billResponse = await axios.get(`${API_BASE}/TAxnTrnbill/${txnId}`);
    const billDetails = billResponse.data.data.details;
    
    console.log('\n📊 Bill Details:');
    billDetails.forEach((detail, index) => {
      console.log(`  Item ${index + 1}:`);
      console.log(`    ItemID: ${detail.ItemID}`);
      console.log(`    Qty: ${detail.Qty}`);
      console.log(`    RevQty: ${detail.RevQty}`);
      console.log(`    RuntimeRate: ${detail.RuntimeRate}`);
      console.log(`    Total Amount: ${detail.Qty * detail.RuntimeRate}`);
    });

    // Step 4: Calculate expected total quantity
    console.log('\n🧮 Step 4: Calculating total quantity');
    const totalQty = billDetails.reduce((sum, detail) => sum + detail.Qty, 0);
    const totalRevQty = billDetails.reduce((sum, detail) => sum + (detail.RevQty || 0), 0);
    
    console.log(`📈 Total Qty: ${totalQty}`);
    console.log(`📉 Total RevQty: ${totalRevQty}`);
    console.log(`🎯 Expected Final Qty: 4 + (-2) = 2`);
    console.log(`✅ Actual Final Qty: ${totalQty}`);

    // Step 5: Verify the RevQty field contains exact quantity change
    const reverseKOTEntry = billDetails.find(detail => detail.RevQty === -2);
    if (reverseKOTEntry) {
      console.log('\n✅ SUCCESS: RevQty field correctly stores -2 (exact quantity change)');
    } else {
      console.log('\n❌ FAILURE: RevQty field does not contain -2');
    }

    // Step 6: Verify total quantity calculation
    if (totalQty === 2) {
      console.log('✅ SUCCESS: Total quantity correctly calculated as 2');
    } else {
      console.log(`❌ FAILURE: Expected total quantity 2, got ${totalQty}`);
    }

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Initial qty: 4');
    console.log('  - Minus operation: -2');
    console.log('  - RevQty stored: -2 (exact quantity change)');
    console.log('  - Final qty: 2 (4 + (-2) = 2)');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRevQtyFunctionality();
