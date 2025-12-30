const axios = require('axios');

async function testSettleAPI() {
  try {
    // First, let's get some transaction data
    const response = await axios.get('http://localhost:3001/api/TAxnTrnbill');
    console.log('Transactions:', response.data);

    if (response.data && response.data.length > 0) {
      const txnId = response.data[0].TxnID;
      console.log('Testing settle API for TxnID:', txnId);

      // Test the settle endpoint
      const settleResponse = await axios.post(`http://localhost:3001/api/TAxnTrnbill/${txnId}/settle`, {
        settlements: [
          {
            PaymentTypeID: 1,
            PaymentType: 'Cash',
            Amount: response.data[0].Amount
          }
        ]
      });
      console.log('Settle response:', settleResponse.data);
    } else {
      console.log('No transactions found to test settle API');
    }
  } catch (error) {
    console.error('Error testing API:', error.response ? error.response.data : error.message);
  }
}

testSettleAPI();
