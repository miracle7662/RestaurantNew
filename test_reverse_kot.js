const fetch = require('node-fetch');

// Test script to verify reverse KOT functionality
async function testReverseKOT() {
  try {
    console.log('Testing reverse KOT functionality...\n');
    
    // Test data - you'll need to replace these with actual values from your database
    const testData = {
      txnId: 1, // Replace with actual TxnID
      tableId: 1, // Replace with actual TableID
      itemId: 1, // Replace with actual ItemID
      qtyToReverse: 1
    };
    
    console.log('Test data:', testData);
    
    const response = await fetch('http://localhost:3001/api/TAxnTrnbill/kot/reverse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ Reverse KOT created successfully!');
      console.log(`📝 Reverse TxnID: ${result.data.reverseTxnId}`);
      console.log(`📊 Reverse Quantity: ${result.data.reverseQty}`);
    } else {
      console.log('❌ Reverse KOT failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing reverse KOT:', error.message);
  }
}

// Run the test
testReverseKOT();
