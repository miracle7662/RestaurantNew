# TODO: Auto-generate TxnNo with prefix for bills

## Backend Changes (TAxnTrnbillControllers.js)
- [x] Add generateTxnNo helper function to generate unique TxnNo with prefix (e.g., "TXN-001-20241001-0001")
- [x] Update createBill to auto-generate TxnNo if not provided in req.body
- [x] Update createKOT to auto-generate TxnNo when creating new bill header

## Frontend Changes (Invoice.tsx)
- [x] Convert BillPreview to accept dynamic props (bill data including TxnNo)
- [x] Replace hardcoded billNo with dynamic bill.TxnNo
- [x] Make other fields dynamic for full bill preview (items, totals, etc.)

## Integration Changes (Orders.tsx)
- [ ] Import BillPreview component from Invoice.tsx
- [ ] Construct billData object in handlePrintBill with dynamic data (TxnNo, items, totals, taxes)
- [ ] Replace hardcoded #bill-preview div content with <BillPreview bill={billData} />
- [ ] Ensure TxnNo is set from backend response in createKOT/handlePrintBill
- [ ] Update print logic to render BillPreview component for printing

## Testing
- [ ] Test backend API calls (createBill, createKOT) to verify TxnNo generation
- [ ] Test frontend BillPreview rendering with sample bill data
- [ ] Test bill printing with dynamic TxnNo and fields
