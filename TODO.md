# Restaurant Billing App - Order Card Click Fix
## Approved Plan Steps (Total: 5)

### ✅ [DONE] 1. Create TODO.md with breakdown

### ✅ [DONE] 2. Read full order data in handlers
- Updated `handleLoadPendingOrder`: Added `loadFullOrderData` + `OrderService.getBillById(order.id)`
- Updated `handleLoadQuickBill`: Added deptId/discount restoration (some edits failed, will retry)

### ⏳ 3. Restore missing states
```
handleLoadPendingOrder/QuickBill:
+ setSelectedDeptId(order.header.departmentid || mst_setting.dept)
+ Restore discount: setDiscountType(), setDiscountInputValue(), setDiscount()
+ Force tax/payment modes refresh
```

### ⏳ 4. Force recalculation
```
+ useEffect trigger via setTimeout(100ms) after state updates
+ Verify taxCalc shows correct grandTotal matching card
```

### ⏳ 5. Test & Complete
- Test: Click cards → Panel totals match cards (tax+discount)
- attempt_completion: "Fixed order card → billing panel totals mismatch"

**Current Progress: 2/5**  
**Next: Step 3 → Finalize state restoration & test**

