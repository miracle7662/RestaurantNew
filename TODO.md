# TODO: Update saveKOT functionality to print Restaurant Name, Outlet Name, KotNo, and Pax

## Completed Tasks
- [x] Update KotPrint.tsx to accept pax, restaurantName, and outletName as props
- [x] Modify the print content to include Pax in the details section and use the provided names for the header
- [x] Update Billview.tsx to pass pax, user?.hotel_name as restaurantName, user?.outlet_name as outletName to KotPreviewPrint
- [x] Fetch restaurant name and outlet name from database when loading bills
- [x] Set activeTab based on Order_Type from loaded bill data
- [x] Update KotPreviewPrint to use restaurantName and outletName state variables

## Summary
The saveKOT button in Billview.tsx now saves data properly and triggers printing via KotPrint.tsx. The print now includes:
- Restaurant Name (fetched from database or user object)
- Outlet Name (fetched from database or user object)
- KotNo (already present)
- Pax (from pax state)
- Order Type (from database Order_Type field)

All changes have been implemented successfully. The restaurant name, outlet name, and order type are now properly displayed in KOT prints by fetching the data from the database when loading bills.
