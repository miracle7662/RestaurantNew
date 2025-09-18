# TODO: Modify Item Insertion to Always Add New Rows

## Completed Tasks
- [x] Modify handleAddItem in src/views/apps/Transaction/OrderDetails.tsx to always add new rows for each item insertion, removing the merging logic.

## Pending Tasks
- [ ] Verify that the grouping logic in src/views/apps/Transaction/Orders.tsx display works correctly with multiple rows of the same item.
- [ ] Confirm that the Print & Save KOT logic in Orders.tsx sends the correct quantities based on the new rows (it should sum quantities for new items).
- [ ] Test the insertion behavior: ensure adding the same item multiple times creates separate rows.
- [ ] Test the grouped view: toggle to grouped mode and verify identical items are grouped with summed quantities.
- [ ] Test the individual view: ensure each row is displayed separately.
