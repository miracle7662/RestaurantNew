# Update formatMySQLDate in AccountLedgerController

## Steps:
1. Add `const { formatMySQLDate } = require('../utils/dateUtils');` import
2. Update `createLedger`: Handle `created_date`, use `formatMySQLDate(created_date)` in INSERT
3. Update `updateLedger`: Use `formatMySQLDate(updated_date)` instead of CURRENT_TIMESTAMP
4. Format `OpeningBalanceDate` with `formatMySQLDate`
5. [x] Test API endpoints
6. [x] Complete
