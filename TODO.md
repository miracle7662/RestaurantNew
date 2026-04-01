# Fix Bill Print Issue: No Items/Qty/Rate/Amount in Bill Preview

**Status**: [ ] 0% Complete

## Approved Plan Steps

### [✅] Step 1: Add Bill Print State ✓
**File**: `src/views/apps/Transaction/Orders.tsx`
- Add state: `billPrintData` object to hold `{items, orderNo, customerName, taxCalc, taxRates, discount, selectedWaiter, selectedTable, mobileNumber, currentKOTNos}`
- Initialize as `{items: [], orderNo: null, ...}`

### [✅] Step 2: Update handlePrintBill(txnId) ✓
**File**: `src/views/apps/Transaction/Orders.tsx`
```tsx
handlePrintBill(txnId?: number) => {
  // 1. Prepare bill data BEFORE clearing items
  const billData = {
    items: [...items],  // Snapshot current items
    orderNo: orderNo || `BILL-${Date.now()}`,
    customerName, mobileNumber,
    taxCalc, taxRates, discount,
    selectedWaiter, selectedTable,
    currentKOTNos, currentKOTNo,
    activeTab
  };
  setBillPrintData(billData);
  
  // 2. Existing backend call (mark as billed)
  await OrderService.markBillAsBilled(id, {...});
  
  // 3. Open modal with data ✅
  setShowBillPrintModal(true);
}
```

### [ ] Step 3: Update BillPreviewPrint JSX Usage
**File**: `src/views/apps/Transaction/Orders.tsx`
```tsx
<BillPreviewPrint
  show={showBillPrintModal}
  items={billPrintData.items}
  orderNo={billPrintData.orderNo}
  customerName={billPrintData.customerName}
  // ... all 15+ required props
  onHide={() => {
    setShowBillPrintModal(false);
    setBillPrintData({items: [], orderNo: null, ...}); // Reset
  }}
  autoPrint={true}
/>
```

### [ ] Step 4: Fix handlePrintKotAndBill Flow
**File**: `src/views/apps/Transaction/Orders.tsx`
- Move `setItems([])` AFTER bill modal closes
- Add `onHide` callback to reset state post-print

### [ ] Step 5: Test & Verify
```
1. F9 → KOT prints ✅ (already works)
2. QuickBill → F9 → "Print KOT & Bill" → Bill shows items/qty/rate/amount ✅
3. Dine-in Table → Add items → F9 → Bill preview has data ✅
4. Verify print preview HTML renders correctly
```

**Next Action**: Complete Step 1 → Confirm → Step 2 → etc.

**Progress**: 0/5 steps complete

