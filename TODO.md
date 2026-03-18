# Quick Bill Header Fix - TODO

**Goal:** Fix Quick Bill print header to show "Quick Bill" in table_name (like Pickup/Delivery).

## Steps (Approved Plan):
✅ **1. [DONE]** Analyzed files: Orders.tsx (frontend), ordersController.js, TAxnTrnbillControllers.js (backend).  
   - Confirmed root cause: missing Quick Bill case in `tableNameForKOT`.

✅ **2. [DONE]** Created plan → User approved.

✅ **3. [DONE]** Edited `src/views/apps/Transaction/Orders.tsx`:  
   - In `handlePrintAndSaveKOT()` → Added `activeTab === 'Quick Bill' ? 'Quick Bill'` to `tableNameForKOT`.

**4. [PENDING]** Test:  
   - Quick Bill tab → Add items → F9 (print/save) → Verify "Quick Bill" in header.  
   - Ensure Pickup/Delivery unchanged.

**5. [PENDING]** `attempt_completion`: Mark task complete.

**Next Action:** Test the fix (step 4).

