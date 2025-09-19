# TODO: Implement Discount_Amount per item in TAxnTrnbilldetails

## Tasks
- [x] Update createBill function in backend/controllers/TAxnTrnbillControllers.js to calculate and insert Discount_Amount for each detail item
- [x] Update updateBill function in backend/controllers/TAxnTrnbillControllers.js to calculate and insert Discount_Amount for each detail item
- [x] Ensure Discount_Amount column exists in TAxnTrnbilldetails table (via migration if needed)
- [ ] Test creating and updating bills to verify Discount_Amount is correctly stored

## Details
- For each item in TAxnTrnbilldetails, calculate Discount_Amount based on bill-level discount:
  - If DiscountType == 1 (percentage): Discount_Amount = (RuntimeRate * Qty * DiscPer) / 100
  - Else (fixed amount): Discount_Amount = Discount (bill-level fixed discount applied to each item)
- Add Discount_Amount to the INSERT statements for TAxnTrnbilldetails in createBill and updateBill functions
