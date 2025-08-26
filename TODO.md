# TODO: Fix fetchOutletUsers Issue

## Problem
The `fetchOutletUsers` function is only showing `hotel_admin` records but not showing records created by `superadmin`.

## Steps to Fix

1. [x] Update the backend controller (`outletUserController.js`) to modify the SQL query in the `getOutletUsers` function
2. [ ] Test the updated API endpoint to ensure it returns the correct data for superadmin users
3. [ ] Verify the frontend displays the correct users

## Current Status
- Analyzing the issue: COMPLETED
- Plan created: COMPLETED
- Backend update: COMPLETED
- Testing: IN PROGRESS
- Verification: PENDING

## Changes Made
- Modified the `getOutletUsers` function to handle `superadmin` users properly
- Added support for filtering by `created_by_id` parameter
- Added join to include creator username in the response for better debugging
- Updated the SQL query to allow superadmin to see all users without hotel restrictions

## Notes
- The backend now properly handles superadmin users and can filter by created_by_id
- Created test script `test_fetchOutletUsers.js` to verify the API endpoint
