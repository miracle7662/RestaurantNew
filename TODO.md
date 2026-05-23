# TODO

- [x] Confirm whether hotel logo is already being fetched in `getHotelMasters` / `getHotelMastersById` (it currently selects `H.Logo`).
- [ ] Ensure returned `Logo` path can be used directly by frontend (BillPrint expects `billData.Logo` / `billData.hotelLogo` / `billData.logo`).
- [ ] Verify where `billData` comes from when printing and ensure it includes `Logo` from hotel master.
- [ ] If needed, add API response mapping (e.g., add `logo` alias or URL normalization) so image renders.


