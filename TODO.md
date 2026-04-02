## TODO: Fix handlePrintKotAndBill → Bill Preview Items Not Showing

### ✅ Plan Approved - Step-by-Step Implementation

**Step 1 [IN PROGRESS]** ⏳ Read BillPrint.tsx to confirm items rendering logic  
**Step 2** ✏️ Edit Orders.tsx: Add `setPrintItems(items.filter(item => item.qty > 0))` in `handlePrintBill()`  
**Step 3** 🔍 Update `resetBillingPanel()` to clear bill print states  
**Step 4** 🧪 Test F9/F10 bill print flow (Quick Bill + Dine-in)  
**Step 5** ✅ Run `npm run dev` → Verify items show in bill preview modal  
**Step 6** 🎉 attempt_completion

**Expected Result**: Items data renders correctly in BillPreviewPrint modal when pressing F9/F10.

---

*Progress tracked automatically. Steps marked as completed when tools confirm success.*

