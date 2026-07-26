# Bill-Wise Checkout Implementation - COMPLETED ✅

## File 1: `backend/procedures/sp_perform_checkout.sql`
- [x] Fix Main Flow Folio INSERT (replace `v_is_billwise` with `p_bill_no`-based filter)
- [x] Add `bill_no` column to `Checkout_Room_Charges` INSERT
- [x] Add `bill_no` column to `Checkout_Detail` INSERT
- [x] **Note**: Case 4/5 already filter by `bill_no = 1` in folio inserts. Their detection logic is lodging-specific (room-based) and won't trigger for non-lodging bills.
- [x] **Note**: Case 6 (Undo) operates on Checkout_Detail rows which only exist for lodging (bill_no=1), so no additional bill_no filtering needed.
- [x] **Fix Step 1**: Changed `p_bill_no` → `COALESCE(p_bill_no, 1)` in INSERT INTO Checkout_Master to ensure default bill_no=1 when NULL
- [x] **Fix Step 2**: Added missing `AND cgfm.bill_no = 1` filter and semicolon in Case 4 folio INSERT
- [x] **Fix Step 3**: Added missing `AND cgfm.bill_no = 1` filter and semicolon in Case 5 folio INSERT

## File 2: `src/common/hotel/checkout.ts`
- [x] Add `bill_no?: number` to `PerformCheckoutPayload` interface

## Files Reviewed - No Changes Needed
- [x] `checkoutController.js` - Already passes `bill_no` as param 45 ✅
- [x] `RoomDetailSummary.tsx` - Already uses `bill_no` in payload ✅

