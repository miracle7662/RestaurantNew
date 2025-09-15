# TODO: Fix KOT Quantity Issues and Add Load KOT Functionality

## Pending Tasks
- [x] Fix quantity fetching in Orders.tsx: Change fetchUnbilledItems to use NetQty instead of Qty
- [x] Modify handlePrintAndSaveKOT in Orders.tsx: Always create new KOT instead of updating existing to prevent qty accumulation (fixed by marking previous KOTs as billed in backend)
- [ ] Add load KOT functionality in Orders.tsx: Implement function to load a specific saved KOT and update saved KOTs modal with "Load" button
- [ ] Modify handleTableClick in Orders.tsx: Do not fetch unbilled items automatically, set items to [] instead
- [ ] Add load KOT functionality in OrderDetails.tsx: Allow loading a specific saved KOT's items into the order details
- [ ] Test changes: Verify quantities are correct, PUT errors resolved, and load KOT works properly
- [ ] If PUT errors persist, investigate backend updateBill function for data validation issues
- [x] Remove all frontend code that manages, calculates, or sends revqty to the backend
