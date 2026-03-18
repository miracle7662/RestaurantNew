## Task: Fix blank screen after payment/settlement in Orders.tsx

### Approved Plan Summary
- **Problem**: After payment/print settlement → blank screen instead of "all tables" tab.
- **Root Cause**: Missing `setActiveNavTab('ALL')` + async race condition.
- **Files**: Orders.tsx (main fix), Tableview.tsx (verify).

### Steps (0/5 completed):

#### ☐ Step 1: Create TODO.md [COMPLETED]
Created this file to track progress.

#### ✅ Step 3: Edit Orders.tsx [COMPLETED]
**Changes Applied** (`handleSettleAndPrint()`):
```
✅ setActiveNavTab('ALL');        // Show ALL departments/tables
✅ setActiveTab('Dine-in');       // Dine-in tab
✅ await fetchTableManagement();  // Refresh tables  
✅ setTimeout(..., 200ms);        // Hide order panel after render
```
Removed conditional `handleBackToTables()` → **ALWAYS** ALL tables view.

#### ✅ Step 4: Verify Tableview.tsx ALL tab logic [COMPLETED]
- `activeNavTab === 'ALL'` → `filtered = tableItems` (all tables shown)
- `useEffect(activeNavTab, ...)` → Correct filtering logic ✅
- **NO CHANGES NEEDED** - Tableview works correctly.

#### ☐ Step 5: Test & Complete
```
npm run dev
Test flows:
✅ 1. QuickBill → Items → F11 → Settle → ALL tables view
✅ 2. Pickup/Delivery → Settle → ALL tables view  
✅ 3. Dine-in Table → Settle → ALL tables view
```
Run `attempt_completion`.

*Updated: After Orders.tsx fix*

---
*Track progress by updating this file after each step.*

**Target**: `handleSettleAndPrint()` function (around line ~3000+)
```
Add after backend settlement success:
setActiveNavTab('ALL');  // Ensure ALL tables view
await fetchTableManagement();  // Wait for refresh
setTimeout(() => {}, 100);  // Force UI sync
```

#### ☐ Step 4: Verify Tableview.tsx ALL tab logic
- Confirm `activeNavTab === 'ALL'` renders all tables.
- No changes needed if correct.

#### ☐ Step 5: Test & Complete
```
npm run dev
Test flow: QuickBill → Items → F11 → Settle → Verify ALL tables shown
```
Run `attempt_completion`.

*Updated: [Current time]*

---
*Track progress by updating this file after each step.*

