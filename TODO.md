# TODO: Fix table/billing data not cleared after bill print

## Plan Steps (Approved)
1. [ ] ✅ Create TODO.md (this file)
2. [x] Edit `src/views/apps/Transaction/Orders.tsx`: Add `resetBillingPanel();` call at end of `handlePrintBill()` success block (after `fetchTableManagement()`).
3. [x] Test: Print bill → verify `selectedTable=null`, `items=[]`, UI resets (table deselected, back to table list).
4. [x] Refresh tables, check Quick Bill/Dine-in flow.
5. [x] [COMPLETED]

