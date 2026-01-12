# TODO for AccountNatureController Modifications

- [x] Modify listAccountNatures function: Replace req.companyid with req.hotelid and remove yearid from query
- [x] Modify getAccountNatureById function: Replace req.companyid with req.hotelid and remove yearid from query
- [x] Modify createAccountNature function: Update req.body to use hotelid instead of companyid and yearid, adjust INSERT statement
- [x] Modify updateAccountNature function: Replace req.companyid with req.hotelid, remove yearid from body and queries, update WHERE and SET clauses
- [x] Modify deleteAccountNature function: Replace req.companyid with req.hotelid and remove yearid from WHERE clause

# TODO for AccountLedgerController Modifications

- [ ] Modify getCustomers function: Replace req.companyid with req.hotelid and remove yearid from query and params
- [ ] Modify getFarmers function: Replace req.companyid with req.hotelid and remove yearid from query and params
- [ ] Modify getLedger function: Replace req.companyid with req.hotelid and remove yearid from query and params
- [ ] Modify createLedger function: Replace req.companyid with req.hotelid, remove yearid from INSERT and account type query
- [ ] Modify updateLedger function: Replace req.companyid with req.hotelid, remove yearid from UPDATE and ownership check
- [ ] Modify deleteLedger function: Replace req.companyid with req.hotelid in ownership check
- [ ] Modify getCashBankLedgers function: Replace req.companyid with req.hotelid and remove yearid from query
- [ ] Modify getOppBankList function: Replace req.companyid with req.hotelid and remove yearid from query
- [ ] Modify getCustomerByNo function: Replace req.companyid with req.hotelid and remove yearid from query
- [ ] Modify getFarmerByNo function: Replace req.companyid with req.hotelid and remove yearid from query
- [ ] Modify getsodacustomer function: Replace req.companyid with req.hotelid and remove yearid from query
- [ ] Modify getOutstandingCustomersAndFarmers function: Replace req.companyid with req.hotelid and remove yearid from all subqueries and WHERE clauses
- [ ] Modify getNextLedgerNo function: Replace req.companyid with req.hotelid and remove yearid from query
