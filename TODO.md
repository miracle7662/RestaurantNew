# MySQL Migration Plan for TAxnTrnbillControllers.js

## Status: [ ] 0% Complete

**Goal:** Convert SQLite → MySQL queries in backend/controllers/TAxnTrnbillControllers.js (26 functions, 50+ queries)

### Current Progress:
- ✅ Plan approved by user
- ⏳ Created TODO.md

### Breakdown Steps:

**1. [✅] Utilities (generateTxnNo, generateOrderNo)** 
   - Made functions async with proper MySQL query handling
   - Updated result destructuring `[rows] = await db.query()` 
   - All SQLite patterns converted

**2. [ ] Simple Queries (getBillById, getSavedKOTs, etc.)**
   - Replace .prepare().all/get → db.query()

**3. [ ] Complex Queries (getAllBills GROUP_CONCAT/JSON_OBJECT)**
   - MySQL-compatible JSON_OBJECT/GROUP_CONCAT ✓
   - Dynamic SQL safe conversion

**4. [ ] Transaction-heavy Functions (createBill, updateBill, etc.)** 
   - 15+ transactions → async/await db.beginTransaction()/commit()/rollback()
   - Preserve exact param order/logic

**5. [ ] createKOT Named Params**
   - @param → ? with object spreading fix

**6. [ ] Test & Validate**
   - No syntax errors
   - Logic identical (no business changes)

**Next:** Step 1 → Utilities → read_file → edit_file → confirm → Step 2...

**Files:** backend/controllers/TAxnTrnbillControllers.js only
**DB:** MySQL (mysql2 assumed in config/db.js)

