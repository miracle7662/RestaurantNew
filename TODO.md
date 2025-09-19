# Discount Fields Debug & Fix TODO

## Frontend Fixes (src/views/apps/Transaction/Orders.tsx)
- [x] Add `Discount` state variable for amount discount (already present)
- [ ] Fix DiscountType values to match backend: 1 = Percentage, 0 = Amount
- [ ] Add discountInputValue state for modal input
- [ ] Fix modal to use discountInputValue and set on open
- [ ] Fix `handleApplyDiscount` to handle both percentage and amount calculations
- [ ] Update bill preview to show correct discount based on DiscountType
- [ ] Ensure discount fields (DiscPer, Discount, DiscountType) are sent in createBill API call
- [ ] Ensure discount fields are sent in createKOT API call
- [ ] Ensure discount fields are sent in updateBill API call

## Backend Verification (backend/controllers/TAxnTrnbillControllers.js)
- [ ] Confirm console logs for discount fields in createBill
- [ ] Confirm console logs for discount fields in createKOT
- [ ] Confirm proper insertion of DiscPer, Discount, DiscountType in DB

## Testing
- [ ] Test percentage discount (10%) - verify DB shows DiscPer=10, DiscountType=1, Discount=calculated amount
- [ ] Test amount discount (₹100) - verify DB shows DiscPer=0, DiscountType=0, Discount=100
- [ ] Check DB schema for DiscPer (REAL), DiscountType (INTEGER), Discount (REAL)

## Followup
- [ ] Run tests and verify DB entries
- [ ] If issues, check DB schema or API parsing
