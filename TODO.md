# TODO: Fix Takeaway Order Card Click Issue

## Issue Description
When clicking on takeaway order cards, the order number (orderno) and KOT number (kotno) are not showing properly. The fetch operation is failing.

## Root Cause
The frontend `loadTakeawayOrder` function expected the backend API response to have `data.header` and `data.kotNo` properties, but the backend `getBillById` function was returning the bill data directly without this structure.

## Changes Made

### Backend (TAxnTrnbillControllers.js)
- [x] Modified `getBillById` function to return data in the expected format: `{ header: billData, details, settlement, kotNo }`
- [x] Added query to fetch the maximum KOT number from TAxnTrnbilldetails for the transaction

### Frontend (Billview.tsx)
- [x] Updated `loadTakeawayOrder` to prioritize `data.kotNo` from backend response
- [x] Added fallback logic to calculate max KOT from order items if backend doesn't provide it
- [x] Fixed TypeScript null check issues in `saveKOT` function

## Testing Status
- [x] Backend syntax check passed
- [x] Frontend TypeScript compilation errors resolved
- [ ] Need to test the actual takeaway order card click functionality

## Next Steps
1. Test the takeaway order card click functionality
2. Verify that order numbers and KOT numbers display correctly
3. Check if the backend properly returns the max KOT number for takeaway orders
