# TODO: Implement RevQty (Reverse Quantity) Handling

## Tasks
- [ ] Backend: Modify reverseKOT in TAxnTrnbillControllers.js to create new entry with Qty=0 and RevQty negative instead of updating Qty
- [ ] Backend: Update getUnbilledItemsByTable and getUnbilledItemsByKOTNo to calculate NetQty = SUM(Qty + RevQty)
- [ ] Backend: Ensure createBill and updateBill handle RevQty correctly in inserts
- [ ] Frontend: Update OrderDetails.tsx to display cancelled items separately with RevQty negative
- [ ] Frontend: Modify handleAddItem and quantity reduction logic to support RevQty entries
- [ ] Frontend: Show all KOT numbers for the table in billing panel
- [ ] Frontend: Ensure RevQty items appear in KOT print for kitchen
- [ ] Test: Verify quantity reduction creates new RevQty entry without overwriting original Qty
- [ ] Test: Verify billing calculation uses NetQty = SUM(Qty + RevQty)
- [ ] Test: Verify frontend displays cancellations separately and shows all KOT numbers
