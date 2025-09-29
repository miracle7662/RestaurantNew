# TODO List for Bill Preview Update in Orders.tsx

## Task: Update bill preview to match the provided image format

### Steps:

1. **Update the #bill-preview div structure in Orders.tsx**  
   - Replace the current card-based layout with a simple receipt-style div layout.  
   - Remove w-50 mx-auto and card classes; use inline styles for width: 80mm, font-family: 'Courier New', monospace or Arial, small font-size (0.8rem).  
   - Ensure all content is centered where appropriate, with dashed borders for sections.

2. **Add header section**  
   - Centered bold restaurant name: Use `user?.outlet_name || 'RESTAURANT'`.  
   - Below: Address lines, e.g., `user?.outlet_address || '221-524-07-5215007, Kolhapur Road, Kolhapur 416416'`.  
   - GSTIN: `formData.gstin || '27AAFCF8595Q1Z5'` (add to formData if needed via fetchBillPreviewSettings).  
   - FSSAI: `formData.fssai_no || 'GSTIN:27AAFCF8595Q1Z5'`.  
   - Use divs with text-center, fw-bold classes.

3. **Add bill details row**  
   - Flex row (d-flex justify-content-between or grid) for:  
     - Date: `new Date().toLocaleDateString('en-GB')` (e.g., 25/07/2024).  
     - Bill No.: `TAN ${TxnNo || '1445'}`.  
     - Table No.: `${selectedTable || '4'}`.  
     - Time: `new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })` (e.g., 23:25).  
   - Style as small text, perhaps in a single line or two.

4. **Update items section**  
   - Use a table or div grid with columns: Serial #, Description (item.name, grouped), Qty (displayQty), Rate (price.toFixed(2)), Amount ((price * qty).toFixed(2)).  
   - Group items by name as in current code (reduce to unique names with summed qty).  
   - Add serial numbers (index + 1).  
   - Align right for Qty/Rate/Amount.

5. **Update totals section**  
   - If discount > 0: Show "Discount: Rs. {discount.toFixed(2)}".  
   - Taxable Value: Rs. {(taxCalc.subtotal - discount).toFixed(2)}.  
   - CGST @ {taxRates.cgst}%: Rs. {taxCalc.cgstAmt.toFixed(2)} (if cgstAmt > 0).  
   - SGST @ {taxRates.sgst}%: Rs. {taxCalc.sgstAmt.toFixed(2)} (if sgstAmt > 0).  
   - Conditional for IGST/CESS if amounts > 0.  
   - Grand Total: Rs. {(taxCalc.grandTotal - discount).toFixed(2)}, bold.  
   - Right-aligned.

6. **Add footer**  
   - Centered: `formData.footer_note || 'STAY SAFE, STAY HEALTHY'`.  
   - Small text.

7. **Enhance print styles**  
   - In the <style> tag, add @media print rules: body { margin: 0; width: 80mm; font-size: 10pt; } .bill-preview { width: 80mm; }.  
   - Hide unnecessary elements, ensure black text.

### Status
- [x] Step 1: Update structure
- [x] Step 2: Header
- [x] Step 3: Bill details
- [x] Step 4: Items
- [x] Step 5: Totals
- [x] Step 6: Footer
- [x] Step 7: Print styles
- [ ] Test: Run app, add items, print bill to verify match.

## Previous Tasks
(Existing content from TODO.md if any - append new task above)
