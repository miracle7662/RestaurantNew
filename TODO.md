# TODO: Fix GST No not showing on bill print

## Plan Steps (Approved by user):
1. [x] Add debug console.log for `showAll` in `generateBillContent()` in `src/views/apps/PrintReport/BillPrint.tsx`
2. [x] Update GST condition to `(showAll || localFormData.trn_gstno || !!user?.trn_gstno)` for robust fallback
3. [ ] Test bill print and check browser console logs
4. [ ] Instruct user to enable "44. trn_gstno ON" in Outlet settings if flag is false
5. [ ] Mark complete if fixed

**Current Progress:** Ready to implement step 1-2 in BillPrint.tsx
