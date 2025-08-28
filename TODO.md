# Outlet Users Fix - TODO List

## Issue: Only hotel_admin records showing in datatable, outlet_user data not displaying

### Root Cause:
Frontend filtering logic in `fetchOutletUsers` function is removing hotel_admin records after backend correctly returns both outlet_user and hotel_admin records.

### Steps to Fix:
1. [ ] Remove filtering logic from `fetchOutletUsers` function in OutletUser.tsx
2. [ ] Update state management to handle both user types
3. [ ] Verify UI renders correctly for different user roles

### Files to Modify:
- src/views/apps/Masters/CommanMasters/OutletUser/OutletUser.tsx

### Testing:
- Test as superadmin/brand_admin to see both tabs working
- Test as hotel_admin to see combined list with both user types
