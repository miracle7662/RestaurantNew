# Fix Pickup/Delivery/QuickBill Total Amount Display Bug

## Plan Progress Tracker
✅ **Step 1:** Create TODO.md [DONE]

## Steps to Complete (from approved plan):

**Step 2: Edit src/views/apps/Transaction/Orders.tsx**
- [ ] **2a.** Fix billing panel JSX: Change "Taxable Value" label + display `taxCalc.grandTotal` instead of `taxableValue`
- [ ] **2b.** Add recalc trigger in `handleLoadQuickBill()` after `setItems()`
- [ ] **2c.** Add recalc trigger in `handleLoadPendingOrder()` after `setItems()`

**Step 3: Test Changes**
- [ ] Click pickup/delivery/quickbill cards → Verify "Total Amount" shows final grandTotal (incl tax)
- [ ] Confirm matches backend bill totals

**Step 4: Complete Task**
- [ ] attempt_completion

**Next Action:** Implement Step 2a, 2b, 2c → Mark as done → Test → Complete


