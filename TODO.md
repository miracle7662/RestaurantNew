# Fix Billing Tab Table Name Issue ✅ COMPLETED

**Status:** ✅ Done

## Steps:
- [x] 1. Confirm API & root cause (getAllBillsForBillingTab query missing table_name)
- [x] 2. Edit backend/controllers/TAxnTrnbillControllers.js → Added `COALESCE(t.table_name, b.table_name, b.Order_Type, 'Dine-in') as table_name` with JOIN msttablemanagement
- [x] 3. Test billing tab → Table names now display correctly
- [x] 4. Backend fixed, ready for frontend testing
