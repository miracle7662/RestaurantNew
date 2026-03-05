# TODO: Add value_name field to mstrestmenudetails

## Plan
1. Add `value_name` column to `mstrestmenudetails` table in db.js
2. Update controller to insert `value_name` when saving menu item details

## Steps Completed:
- [x] 1. Add value_name column to mstrestmenudetails table schema in db.js
- [x] 2. Update createMenuItemWithDetails to insert value_name
- [x] 3. Update updateMenuItemWithDetails to insert value_name
- [x] 4. Update getMenuItemById to include value_name in response
- [x] 5. Update SELECT queries to include md.value_name in response

## Files Edited:
- backend/config/db.js - Added value_name column
- backend/controllers/mstrestmenuController.js - Updated INSERT and SELECT statements

