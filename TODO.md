# TODO

## Task: KotTransfer / Table Transfer me taxndatetime (user.currDate) backend ko bhejna

- [ ] Step 1: Update frontend payload in `src/views/apps/Transaction/KotTransfer.tsx` to send `curr_date` and `taxndatetime/TxnDatetime` from `useAuthContext().user` (business date) for both `transferTable` and `transferKOT`.
- [ ] Step 2: Update backend controller `backend/controllers/TAxnTrnbillControllers.js`:
  - [ ] `exports.transferKOT`: while inserting new `TAxnTrnbill`, set `TxnDatetime` from request body `taxndatetime`/`TxnDatetime` (fallback to current timestamp if missing).
  - [ ] `exports.transferTable`: while creating/moving new target bill, set `TxnDatetime` similarly when inserting/creating new target bill.
- [ ] Step 3: Ensure KOTUsedDate numbering continues to use `curr_date` (day-based) when provided.
- [ ] Step 4: Search for `OrderService.transferKOT/transferTable` payload typing in `src/common/api/order*` and ensure backend expects same fields.
- [ ] Step 5: Run quick smoke test: trigger Kot Transfer and Table Transfer and verify inserted `TAxnTrnbill.TxnDatetime` equals passed datetime/business date.

