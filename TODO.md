# TODO: Fix handlePrintAndSaveKOT Async State Issue

## Plan Steps (Approved by User)
- [ ] 1. Update `handlePrintAndSaveKOT()` in Orders.tsx: Extract `txnId = resp?.data?.TxnID`, `setCurrentTxnId(txnId)`, `return txnId;`, throw if missing.
- [ ] 2. Update `handlePrintKotAndBill()`: `const txnId = await handlePrintAndSaveKOT(); if(!txnId) throw Error; await handlePrintBill(txnId);`
- [ ] 3. Update `handlePrintBill(txnId?: number)`: Use `const id = txnId || currentTxnId;`
- [ ] 4. Test: Quick Bill → F9 → Verify KOT+Bill prints without "No TxnID" error.
- [ ] 5. Mark complete, attempt_completion.

**Status**: Starting edits...

