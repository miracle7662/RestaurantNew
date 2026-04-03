# TaxCalc Fix in Pending Order Print - Progress Tracker

## Plan Status: ✅ APPROVED

**Root Cause**: `handlePrintPendingOrder` missing `selectedDeptId` → zero taxRates → no taxCalc in BillPrint preview.

**Fix**: Add dept lookup matching `handlePendingMakePayment` pattern.

## Steps:

### ✅ 1. Create TODO.md [COMPLETED]
### ✅ 1. Create TODO.md [COMPLETED]
### ✅ 2. Edit Orders.tsx - Add dept lookup in handlePrintPendingOrder [COMPLETED]
### ✅ 3. Test: Pending order → Print Bill → Verify tax values in preview  
### ⏳ 4. attempt_completion

**Next**: Test the fix → completion

