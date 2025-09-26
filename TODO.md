# TODO for Updating Bill Preview in Orders.tsx

## Overview
This TODO tracks the steps to implement the approved plan for updating the bill preview section in `src/views/apps/Transaction/Orders.tsx` to match the desired image format. The changes focus on the hidden `#bill-preview` div used for printing.

## Steps

### 1. [ ] Create/Update TODO.md
   - Already done: This file is created with the breakdown of steps from the plan.

### 2. [ ] Add Bill No Section
   - Insert a new `<div className="text-center mb-3" style={{ fontSize: '0.9rem' }}>` above the existing outlet header div.
   - Content: `<p className="mb-0 fw-bold">Bill No: {currentTxnId || 'N/A'}</p>`.
   - This ensures Bill No displays dynamically from `currentTxnId` (fallback to 'N/A' if not saved yet).

### 3. [ ] Update Header and Note/Date Section
   - In the existing outlet header `<div className="text-center mb-3">`:
     - Prefix phone with "Ph: ", email with "Email: ", website with "Website: ".
   - In the note/date `<div className="text-center mb-3" style={{ fontSize: '0.9rem' }}> `:
     - Update note: `<p className="mb-0">Note: {formData.note || `Order ID: ${currentTxnId || 'N/A'}`}</p>`.
     - Update date: `<p className="mb-0">{new Date().toLocaleDateString('en-GB')} @ {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase()}</p>` for format like "26/05/2025 @ 9:10 PM".

### 4. [ ] Update Pay Mode and User Section
   - In `<div className="d-flex justify-content-between mb-3">`:
     - Left: `<p>Pay Mode: Cash</p>` (hardcoded as per approval).
     - Right: `<p>User: {user?.name || 'TMPOS'}</p>` (already dynamic, ensure it's there).

### 5. [ ] Update Items Table
   - In the `<tbody>` loop: Change `<td>{item.name}</td>` to `<td>{index + 1}. {item.name}</td>` for numbered items like "1. Biryani".
   - Ensure all prices/totals use `.toFixed(2)` and classes for right-align (already present).

### 6. [ ] Update Totals Section
   - Ensure first line: `<p>Total Value: Rs. {taxCalc.subtotal.toFixed(2)}</p>` (acts as Subtotal).
   - GST header: Keep conditional `<p className="mt-2">GST:</p>` if any tax >0.
   - Individual taxes: Keep multi-line as-is (e.g., `<p>CGST ({taxRates.cgst}%): Rs. {taxCalc.cgstAmt.toFixed(2)}</p>` for each >0; group by type, no duplication unless backend provides multiples).
   - Total Tax: Keep `<p className="mt-2">Total Tax (excl.): Rs. {(taxCalc.cgstAmt + taxCalc.sgstAmt + taxCalc.igstAmt + taxCalc.cessAmt).toFixed(2)}</p>`.
   - Custom fields: Keep conditional `<p className="mt-2">{formData.field1}</p>` etc.
   - Discount: Update to `<p className="mt-2">Discount ({DiscountType === 1 ? `${DiscPer}%` : `Amt`}): -Rs. {discount.toFixed(2)}</p>` if discount >0 (add '-' prefix).
   - Grand Total: Keep `<p className="mt-2 fw-bold">Grand Total: Rs. {(taxCalc.grandTotal - discount).toFixed(2)}</p>`.
   - Footer: Ensure `<div className="text-center mt-3">` with footer_note and FSSAI (already present).

### 7. [ ] Apply the Edit to Orders.tsx
   - Use edit_file tool with a diff targeting the entire `#bill-preview` div to replace with the updated content.
   - Verify no syntax errors (e.g., ensure all variables like currentTxnId, DiscountType, DiscPer are in scope – they are).

### 8. [ ] Test the Changes
   - Run `npm run dev`.
   - Add items, set taxes, click "Print Bill".
   - Verify print preview matches image: Bill No, formatted date, user, numbered items, GST lines, totals with discount.
   - Test edges: No TxnID (shows 'N/A'), discount=0, multiple taxes.

### 9. [ ] Update TODO.md for Completion
   - Mark steps as [x] done.
   - Remove or archive if all complete.

### 10. [ ] Final Completion
   - Use attempt_completion to present the result, with optional command like `npm run dev` to demo.

Progress: Starting with Step 7 (edit file) after planning.
