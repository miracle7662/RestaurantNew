# TODO - CGST/SGST null fix on KOT transfer

- [ ] Analyze transferKOT backend logic and identify why header tax fields become NULL
- [x] Plan: Recalculate and update `TAxnTrnbill` header totals (CGST/SGST/IGST/CESS/Amount/TaxableValue/etc.) for target bill after `transferKOT`
- [ ] Implement backend fix in `backend/controllers/TAxnTrnbillControllers.js` (`exports.transferKOT`)
- [ ] Ensure calculations respect outlet `include_tax_in_invoice` + `bill_round_off` settings
- [ ] Run quick sanity checks via node test / linter (if available)

