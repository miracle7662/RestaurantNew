# TODO: Fix Discount Prorating in TAxnTrnbillControllers.js

## Tasks
- [ ] Edit createBill function: Add prorating logic for fixed discounts after computing totalGross, update detail Discount_Amount, and ensure header Discount sums correctly.
- [ ] Edit updateBill function: Apply same prorating logic as createBill after re-inserting details.
- [ ] Edit createKOT function: Prorate discounts when inserting details using bill's DiscPer/Discount/DiscountType, and recalculate header totals.
- [ ] Remove all console.log statements for production cleanliness.
- [ ] Add input validation for discount fields (non-negative, valid types).
- [ ] Test changes: Verify fixed discount prorating sums correctly, percentage discounts unchanged.
- [ ] Restart backend server if needed and commit changes to Git.
