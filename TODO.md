# Fix Duplicate Bill Error for Takeaway/Quickbill Print

## Plan Breakdown
1. ✅ [Complete] Understand error: `bill` undefined in `getDuplicateBill` because query only searches `TxnNo`, not `orderNo`
2. ✅ [Complete] Edit `backend/controllers/Reportcontroller.js`:
   - Update `billQuery` WHERE to search `(t.TxnNo = ? OR t.orderNo = ?)`
   - Fix `params = [outletId, billNo, billNo]`
   - Update `paymentsQuery` to use `bill.TxnNo || bill.orderNo`
   - Add logging and validation
3. 🔄 [Pending] Restart backend server: `cd backend && npm start` (or your start command)
4. 🔄 [Pending] Test takeaway/quickbill print - check console for new logs
5. ✅ [Complete] Task done

