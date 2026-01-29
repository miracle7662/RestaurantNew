# Kitchen Allocation Report Fix - TODO

## Backend Changes ✅
- [x] Update KitchenAllocationController.js to filter using ID columns instead of name columns
- [x] Add debug logging for filterType, filterId, SQL, and params

## Frontend Changes ✅
- [x] Add API calls to fetch filter options (kitchen categories, item groups, departments, users)
- [x] Update dropdown population to use ID as value and name as label
- [x] Update filter logic to use fetched options instead of deriving from data

## Testing and Verification
- [x] Test kitchen-category filter with ID values
- [x] Test item-group filter with ID values
- [x] Test table-department filter with department ID
- [x] Test user filter with user ID
- [x] Verify data appears when filters are applied
- [x] Check console logs for correct filterType and filterId values
- [x] Check SQL logs for correct queries and parameters

## Notes
- Frontend now sends ID values to backend
- Backend now filters on ID columns: kitchen_main_group_id, item_group_id, DeptID, UserId
- Department filter simplified to use DeptID instead of complex table+department logic
- All filter options are fetched from respective APIs on component mount
