// Simple test script to verify inclusive vs exclusive tax calculations

function calc(items, taxRates, includeTaxInInvoice) {
  const lineTotal = items.reduce((s, it) => s + it.price * it.qty, 0);
  const cgstPer = Number(taxRates.cgst) || 0;
  const sgstPer = Number(taxRates.sgst) || 0;
  const igstPer = Number(taxRates.igst) || 0;
  const cessPer = Number(taxRates.cess) || 0;
  const combinedPer = cgstPer + sgstPer + igstPer + cessPer;

  if (includeTaxInInvoice === 1) {
    const subtotal = combinedPer > 0 ? lineTotal / (1 + combinedPer / 100) : lineTotal;
    const cgstAmt = +(subtotal * cgstPer / 100).toFixed(4);
    const sgstAmt = +(subtotal * sgstPer / 100).toFixed(4);
    const igstAmt = +(subtotal * igstPer / 100).toFixed(4);
    const cessAmt = +(subtotal * cessPer / 100).toFixed(4);
    const grandTotal = +(subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt).toFixed(4);
    return { mode: 'Inclusive', lineTotal, subtotal: +subtotal.toFixed(4), cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal };
  } else {
    const subtotal = lineTotal;
    const cgstAmt = +(subtotal * cgstPer / 100).toFixed(4);
    const sgstAmt = +(subtotal * sgstPer / 100).toFixed(4);
    const igstAmt = +(subtotal * igstPer / 100).toFixed(4);
    const cessAmt = +(subtotal * cessPer / 100).toFixed(4);
    const grandTotal = +(subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt).toFixed(4);
    return { mode: 'Exclusive', lineTotal, subtotal: +subtotal.toFixed(4), cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal };
  }
}

const items = [ { price: 100, qty: 2 }, { price: 50, qty: 1 } ];
const taxRates = { cgst: 2.5, sgst: 2.5, igst: 0, cess: 0 };

console.log('Items:', items);
console.log('Tax rates:', taxRates);
console.log('--- Inclusive (flag=1) ---');
console.log(calc(items, taxRates, 1));
console.log('\n--- Exclusive (flag=0) ---');
console.log(calc(items, taxRates, 0));
