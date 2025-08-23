# TODO: Implement mstoutlet_settings GET and UPDATE endpoints

## Steps to Complete:
1. [x] Add GET endpoint to retrieve outlet settings by outletid
2. [x] Add UPDATE endpoint to update outlet settings by outletid
3. [x] Test the new endpoints

## Implementation Details:
- GET endpoint: `/api/outlets/outlet-settings/:outletid`
- UPDATE endpoint: `/api/outlets/outlet-settings/:outletid`
- Both endpoints work with the existing `mstoutlet_settings` table

## Files Modified:
- `backend/controllers/outletController.js` - Added `getOutletSettings` and `updateOutletSettings` functions
- `backend/routes/outletRoutes.js` - Added PUT route for updating outlet settings

## Testing Results:
- ✅ GET endpoint successfully retrieves outlet settings
- ✅ UPDATE endpoint successfully updates outlet settings and returns updated data
- ✅ Both endpoints handle validation and error cases appropriately
