# Fix Pickup/Delivery/Quickbill Cross-Outlet Items Bug

## Plan Status: ✅ APPROVED

**✅ Step 1: Create TODO.md** (Current - Done)

**⏳ Step 2: Edit Backend - TAJnTrnbillControllers.js**
- Add outlet_id filter to getPendingOrders()
- Add outlet_id filter to getAllBills()
- Add outlet_id filter to getAllBillsForBillingTab()

**⏳ Step 3: Test Backend Changes**
```bash
# Backend terminal
cd backend
node server.js
```
- Test /pending-orders?type=pickup with different outlet_id params
- Verify SQL returns only matching outlet orders

**⏳ Step 4: Verify Frontend**
- Check pickup/delivery tabs pass outlet_id
- Test UI shows only current outlet's items

**⏳ Step 5: Complete**
- attempt_completion with test command

**Progress: 1/5 steps complete**

