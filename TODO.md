# TODO: Update saveKOT functionality to print Restaurant Name, Outlet Name, KotNo, and Pax

## Completed Tasks
- [x] Update KotPrint.tsx to accept pax, restaurantName, and outletName as props
- [x] Modify the print content to include Pax in the details section and use the provided names for the header
- [x] Update Billview.tsx to pass pax, user?.hotel_name as restaurantName, user?.outlet_name as outletName to KotPreviewPrint

## Summary
The saveKOT button in Billview.tsx now saves data properly and triggers printing via KotPrint.tsx. The print now includes:
- Restaurant Name (from user?.hotel_name)
- Outlet Name (from user?.outlet_name)
- KotNo (already present)
- Pax (from pax state)

All changes have been implemented successfully.

**Note:** The user needs to log out and log back in for the user object to include the hotel_name and outlet_name properties, as they are fetched from the backend during login.
