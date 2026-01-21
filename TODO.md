# TODO: Update saveKOT functionality to print Restaurant Name, Outlet Name, KotNo, and Pax

## Completed Tasks
- [x] Update KotPrint.tsx to accept pax, restaurantName, and outletName as props
- [x] Modify the print content to include Pax in the details section and use the provided names for the header
- [x] Update Billview.tsx to pass pax, user?.hotel_name as restaurantName, user?.outlet_name as outletName to KotPreviewPrint
- [x] Add state variables for restaurantName and outletName in Billview.tsx
- [x] Modify fetchOutletDetails function to fetch restaurant and outlet names from database API
- [x] Update loadBillForTable and loadTakeawayOrder to fetch outlet details and set order type from loaded bill data
- [x] Add logging to debug outlet API responses
- [x] Fix hotel name display issue by using brand_name from outlet API response instead of hotel_name
- [x] Update name priority order to use user object first, then props, then local state
- [x] Add loading state for outlet details fetching to prevent premature rendering

## Summary
The saveKOT button in Billview.tsx now saves data properly and triggers printing via KotPrint.tsx. The print now includes:
- Restaurant Name (fetched from database or user object)
- Outlet Name (fetched from database or user object)
- KotNo (already present)
- Pax (from pax state)
- Order Type (from database Order_Type field)

All changes have been implemented successfully. The restaurant name, outlet name, and order type are now properly displayed in KOT prints by fetching the data from the database when loading bills. Additionally, KotPrint.tsx now fetches outlet details locally when the props are empty or null to ensure the names are always displayed correctly. The hotel name display issue has been fixed by correctly accessing the brand_name field from the outlet API response.
