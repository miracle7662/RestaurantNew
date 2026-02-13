# Refactoring Plan: refreshItemsForTable in Orders.tsx

## Objective
Refactor the `refreshItemsForTable(tableId)` function in `src/views/apps/Transaction/Orders.tsx` to use a clean service layer (OrderService using HttpClient) instead of direct fetch calls.

## Changes Required

### 1. Update Imports
- Add import for `OrderService` from `@/common/api/order`
- Remove old API import `getUnbilledItemsByTable` from `@/common/api/orders_old`

### 2. Replace Direct Fetch Call
- Replace: `fetch(\`http://localhost:3001/api/TAxnTrnbill/billed-bill/by-table/${tableIdNum}\`)`
- With: `OrderService.getBilledBillByTable(tableIdNum)`

### 3. Replace Old API Call
- Replace: `getUnbilledItemsByTable(tableIdNum)` from `@/common/api/orders_old`
- With: `OrderService.getUnbilledItemsByTable(tableIdNum)`

### 4. Keep Existing Logic Intact
- ✅ Billed bill priority
- ✅ Unbilled fallback
- ✅ Item qty calculation (Qty - RevQty)
- ✅ Reversed items handling
- ✅ TxnID/TxnNo mapping
- ✅ KOT numbers aggregation
- ✅ Discount restoration
- ✅ Customer details

### 5. Extract Reset Logic
- Create a helper function `resetBillingPanel()` that clears all order-related state
- Use this function where needed

### 6. TypeScript Safety
- Ensure proper typing for all mapped objects
- Use consistent interfaces

## Implementation Steps
1. Add OrderService import
2. Replace billed bill fetch with OrderService call
3. Replace unbilled items API with OrderService call
4. Test all functionality works the same
