# KOT Bill Printing Fix - Null Values Issue

## Issue: tableid, outletid, cgst, cgst_amount, sgst, sgst_amount, igst, igst_amount, cess showing null in taxtrnbilldetails table

### Plan Steps:
- [ ] Fix TAxnTrnbillControllers.js - createKOT function
- [ ] Fix tax calculation logic in TAxnTrnbillControllers.js
- [ ] Update frontend data sending in OrderDetails.tsx
- [ ] Add validation and logging
- [ ] Test KOT creation process
- [ ] Test bill printing functionality

### Current Status: In Progress
