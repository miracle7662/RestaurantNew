async function testGenerateReport() {
  try {
    const response = await fetch('http://localhost:3001/api/dayend/generate-report-html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outletId: 1,
        businessDate: '2024-01-26',
        selectedReports: ['billDetails', 'paymentSummary']
      })
    });

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      console.log('HTML generated successfully!');
      console.log('HTML length:', data.html.length);
      console.log('First 500 characters of HTML:');
      console.log(data.html.substring(0, 500));
    } else {
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testGenerateReport();
