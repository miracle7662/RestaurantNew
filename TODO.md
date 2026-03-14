# Task Progress: Fix ReferenceError in mstrestmenuController.js

## Approved Plan Steps:
- [x] **Step 1**: Create TODO.md to track progress
- [x] **Step 2**: Add stub functions `consume_raw_materials_on_bill` & `consume_raw_materials_on_kot` ✓ (both added)
- [ ] **Step 3**: Test menu item update endpoint (Restart server → Edit menu item → Check logs for STUB calls)
- [x] **Step 4**: Updated TODO.md ✓

## Details:
- ✅ Stub function inserted at top of mstrestmenuController.js (no-op + console.log for debugging)
- **To test**: 
  1. Restart backend: `cd backend && npm start`
  2. Update menu item via frontend
  3. Verify no ReferenceError; check for `[STUB]` logs
- If stub called, implement real raw material deduction logic next.


