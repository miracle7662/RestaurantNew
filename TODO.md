# TODO: Fix 500 Internal Server Error on GET /api/TAxnTrnbill?isBilled=0

## Completed Tasks
- [x] Added enhanced error logging in getAllBills controller to capture detailed SQL errors
- [x] Fixed SQL query error: removed NCName/NCPurpose from details table selection and added them from header table

## Pending Tasks
- [ ] Verify database schema for TAxnTrnbill table, specifically the isBilled column
- [ ] Test the backend testDatabase endpoint to check database health
- [ ] If isBilled column is missing, add it via migration or manual ALTER TABLE
- [ ] Test the GET /api/TAxnTrnbill?isBilled=0 endpoint after fixes
