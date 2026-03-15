# Settlement Modal Table Name Fix - TODO

## Plan Status: ✅ APPROVED & IMPLEMENTED

**Total Steps: 4** | **Completed: 3** | **Remaining: 1**

### [x] Step 1: Create TODO.md 
- Status: ✅ DONE

### [x] Step 2: Update src/views/apps/Transaction/Settelment.tsx
- Added `table_name={editing?.table_name || null}` ✅

### [x] Step 3: Update src/views/apps/Billview.tsx  
- Added `table_name={tableName || tableNo || null}` ✅

### [ ] Step 4: Test & Complete
- Verify table name shows in modal title from both Settelment.tsx (Edit button) and Billview.tsx (F11/Print&Settle)
- Run `attempt_completion` once confirmed

