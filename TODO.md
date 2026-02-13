# API Response Format Migration - TODO

## Objective
Remove the `{ success, message, data }` wrapper pattern and use direct objects instead.

## Changes Required

### Phase 1: Backend Changes (TAxnTrnbillControllers.js)
- [ ] 1.1 Update `getAllBills` - Return direct data array instead of `ok('Fetched all bills', data)`
- [ ] 1.2 Update `getBillById` - Return direct object instead of `ok('Fetched bill', {...})`
- [ ] 1.3 Update `createBill` - Return direct object instead of `ok('Bill created', {...})`
- [ ] 1.4 Update `updateBill` - Return direct object instead of `ok('Bill updated', {...})`
- [ ] 1.5 Update `deleteBill` - Return direct object
- [ ] 1.6 Update `settleBill` - Return direct object instead of `ok('Bill settled', {...})`
- [ ] 1.7 Update `addItemToBill` - Return direct object
- [ ] 1.8 Update `updateBillItemsIsBilled` - Return direct object
- [ ] 1.9 Update `createKOT` - Return direct object
- [ ] 1.10 Update `createReverseKOT` - Return direct object
- [ ] 1.11 Update `getSavedKOTs` - Return direct array
- [ ] 1.12 Update `getLatestKOTForTable` - Return direct object
- [ ] 1.13 Update `getUnbilledItemsByTable` - Return direct object (remove {success, message, data} wrapper)
- [ ] 1.14 Update `printBill` - Return direct object
- [ ] 1.15 Update `markBillAsBilled` - Return direct object
- [ ] 1.16 Update `generateTxnNo` - Return direct object
- [ ] 1.17 Update `applyNCKOT` - Return direct object
- [ ] 1.18 Update `applyDiscountToBill` - Return direct object
- [ ] 1.19 Update `getPendingOrders` - Return direct array
- [ ] 1.20 Update `updatePendingOrder` - Return direct object
- [ ] 1.21 Update `getLinkedPendingItems` - Return direct array
- [ ] 1.22 Update `getBillsByType` - Return direct array
- [ ] 1.23 Update `getAllBillsForBillingTab` - Return direct array
- [ ] 1.24 Update `reverseBill` - Return direct object
- [ ] 1.25 Update `getBillStatusByTable` - Return direct object
- [ ] 1.26 Update `saveFullReverse` - Return direct object
- [ ] 1.27 Update `transferKOT` - Return direct object
- [ ] 1.28 Update `transferTable` - Return direct object
- [ ] 1.29 Update `getGlobalKOTNumber` - Return direct object
- [ ] 1.30 Update `getGlobalReverseKOTNumber` - Return direct object

### Phase 2: Frontend Type Changes
- [ ] 2.1 Update `src/types/api.ts` - Keep ApiResponse for error handling, but mark as optional
- [ ] 2.2 Update `src/common/api/ordernew.ts` - Remove ApiResponse<> wrappers from type definitions

### Phase 3: Frontend API Service Changes
- [ ] 3.1 Update `src/common/api/ordernew.ts` - Change all HttpClient calls to use direct types
  - From: `HttpClient.post<ApiResponse<Bill>>('/TAxnTrnbill', payload)`
  - To: `HttpClient.post<Bill>('/TAxnTrnbill', payload)`

### Phase 4: Frontend Component Updates
- [ ] 4.1 Update `src/views/apps/Billview.tsx` - Remove `.success` and `.data` checks
- [ ] 4.2 Update other components that access `.success` and `.data`

## Notes
- The Axios interceptor in httpClient.ts returns `response.data`, so it should work with direct objects
- Error handling should rely on HTTP status codes instead of `{success: false}` wrapper
- Some controllers may need separate error handling updates
