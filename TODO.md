# TODO
- [ ] Implement bill print snapshot in `src/views/apps/Billview.tsx`
  - [ ] Add `billPrintSnapshot` state
  - [ ] Set snapshot in `printBill()` and `PrintAndSettle()` BEFORE opening modal
  - [ ] Pass snapshot values to `<BillPreviewPrint />` (restaurant/outlet + taxCalc + taxRates)
- [ ] Update `src/views/apps/PrintReport/BillPrint.tsx`
  - [ ] Add autoPrint readiness guard (do not print until required values exist)
- [ ] Run TypeScript check / lint
- [ ] Manual test: F10 (Print), F12 (Print&Settle) with multiple outlet/dept changes

