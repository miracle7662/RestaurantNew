# Fix replaceSettlement SQL Error - TODO

**Status: [IN PROGRESS]**

## Approved Plan Steps:

### 1. [PENDING] ✅ Create TODO.md (Current step - DONE)
### 2. [✅ DONE] Edit backend/controllers/settlementController.js
   - ✅ Prepare settlementInsertStmt properly
   - ✅ Fix INSERT columns to match TrnSettlement schema (18 columns: OrderNo, TxnNo, userid, etc.)
   - ✅ Fix UserId → userid  
   - ✅ Fix VALUES params count/order (18 params)
   - ✅ Remove receive/refund/table_name, hardcoded refund=1
   
### 3. [PENDING] Test the fix
   - Restart backend server
   - Test replaceSettlement API endpoint
   - Verify no SQL errors
   - Restart backend server
   - Test replaceSettlement API endpoint
   - Verify no SQL errors

### 4. [PENDING] attempt_completion

**Next step: Edit the controller file**

