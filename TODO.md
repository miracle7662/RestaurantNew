# Account Ledger Update Fix Plan

## Steps:
- [x] 1. Create TODO.md with plan
- [x] 2. Add detailed logging to updateLedger in AccountLedgerController.js
- [ ] 3. Edit frontend service/modal if needed (after logs reveal payload issues)
- [ ] 4. Test update endpoint
- [ ] 5. Check DB table constraints if still failing
- [ ] 6. Remove debug logs after fix confirmed

**Current Status:** Ready to add logging to diagnose why update fails (0 affectedRows? auth? constraints?). Server restart required after edits.

