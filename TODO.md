# TODO: Fix KOT Update to Only Add New Items

## Information Gathered
- Backend has `createBill` for new KOT, `createKOT` and `addItemToBill` for adding to existing KOT.
- Frontend uses `createBill` for all saves, creating new bills instead of updating.
- When adding items to existing KOT, only new items should be sent to backend.
- Need to track saved vs new items in frontend.

## Plan
1. Modify `MenuItem` interface in Orders.tsx to include `isSaved` flag.
2. When selecting table, fetch existing KOT details to get `TxnID`.
3. When loading unbilled items, mark them as `isSaved: true`.
4. When adding new items via OrderDetails, mark as `isSaved: false`.
5. Modify `handlePrintAndSaveKOT` to:
   - If no existing `TxnID`, use `createBill` with all items.
   - If existing `TxnID`, use `createKOT` with only new items (`isSaved: false`).
6. After successful save, mark new items as `isSaved: true` and update `TxnID` if new KOT.
7. Test the functionality.

## Dependent Files
- src/views/apps/Transaction/Orders.tsx
- src/views/apps/Transaction/OrderDetails.tsx (for adding items with isSaved flag)

## Followup Steps
