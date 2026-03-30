# GSTIN Bill Preview Fix - UPDATE PLAN

## ✅ Status
- [x] Debug logs confirm: settings undefined, customer empty, user.trn_gstno ✅ available
- [x] BillPrintService.getBillPrintSettings exists (missing fields from backend)
- [x] BillPreviewPrint receives customerName/mobileNumber props (empty in test)
- [x] Condition analyzed: `localFormData.show_customer_gst_bill && (customerName || mobileNumber)`

## 🔧 Plan (File-level)
**Primary File: src/views/apps/PrintReport/BillPrint.tsx**
1. **Fallback defaults:** `localFormData.show_customer_gst_bill ?? true`
2. **Independent GSTIN section:** Show GSTIN even without customer details when setting enabled
3. **Enhanced condition:** `(showAll || (localFormData.show_customer_gst_bill ?? true))`
4. **More debug:** Log API response from getBillPrintSettings()

**No dependent file edits needed** (props already passed from Orders.tsx/Billview.tsx)

## Followup Steps
1. Apply edit to BillPrint.tsx
2. Test bill preview → F12 console → verify logs
3. `npm run dev` if needed
4. Confirm GSTIN shows with user.trn_gstno

**Ready for implementation**
