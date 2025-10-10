# TODO for Fixing Zero Quantity Items Display

1. [x] Edit `backend/controllers/TAxnTrnbillControllers.js`: Update the SQL query in `getUnbilledItemsByTable` to change the filter from `(d.Qty - COALESCE(d.RevQty, 0)) >= 0` to `(d.Qty - COALESCE(d.RevQty, 0)) > 0` to exclude items with net quantity 0.

2. [x] Update TODO.md to mark the edit as completed.

3. [ ] Suggest restarting the backend server and testing the endpoint to verify zero-quantity items are no longer returned.

4. [ ] Confirm the change in the frontend (Orders.tsx) by reloading the page and checking the display.
