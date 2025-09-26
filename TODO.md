# TODO List for KOT Logic Update

## Completed Tasks
- [x] Modify createKOT function to always use the latest transaction for the table (regardless of isBilled status)
  - Removed conditional logic based on isReversalOnly
  - Changed query to ORDER BY TxnID DESC LIMIT 1 without filtering by isBilled = 0
  - This ensures that after printing a bill, adding new items reuses the existing TxnID instead of creating a new row

## Followup Steps
- [ ] Test the change: Print a bill, then add new items and save KOT to verify it reuses the TxnID
- [ ] Check database to confirm no new TAxnTrnbill row is inserted when adding items to a billed table
