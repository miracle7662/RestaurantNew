# MySQL Conversion TODO - better-sqlite3 → mysql2/promise (AccountLedger, AccountNature, AccountType Controllers)

## Status: 🔄 In Progress (0/5 Complete)

### 1. ✅ Create TODO.md [COMPLETED]

### 2. ⏳ Convert AccountLedgerController.js (largest/complex first)
   - [ ] Replace import: require('../config/db') → mysql2/promise
   - [ ] Remove getAll(), runQuery() helpers  
   - [ ] Convert ~20 stmt.all/get/run → await db.query()
   - [ ] Fix result.id → insertId, changes → affectedRows
   - [ ] Fix getOutstandingCustomersAndFarmers (46 params array)
   - [ ] Verify all responses identical

### 3. ⏳ Convert AccountNatureController.js 
   - [ ] Convert 9 CRUD calls
   - [ ] lastInsertRowid → insertId

### 4. ⏳ Convert AccountTypeController.js
   - [ ] Convert 9 CRUD calls  
   - [ ] lastInsertRowid → insertId

### 5. ⏳ Test & Complete
   - [ ] Test routes: AccountLedgerRoutes, AccountNatureRoutes, AccountTypeRoutes
   - [ ] Verify insertId, affectedRows, row counts match
   - [ ] attempt_completion with results

**Instructions:** Update ✅ when step complete. Follow order strictly.

