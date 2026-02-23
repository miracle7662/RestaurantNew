# Billview Discount & Tax Calculation Fixes

## Issues Fixed

### 1. Fixed Discount Distribution Logic
- **Problem**: Fixed amount discounts were being applied to each item individually instead of being distributed proportionally
- **Solution**: Calculate total gross amount first, then distribute fixed discount proportionally based on each item's line subtotal relative to total gross
- **Location**: `backend/controllers/TAxnTrnbillControllers.js` - `createKOT` function

### 2. Outlet-Specific Tax Rates
- **Problem**: Backend was using hardcoded 2.5% CGST/SGST rates instead of outlet-specific rates
- **Solution**: Fetch tax rates from `mstoutlet_settings` table for each outlet
- **Location**: `backend/controllers/TAxnTrnbillControllers.js` - `createKOT` function

### 3. Variable Scoping Fix
- **Problem**: `totalGrossForDiscount` was being recalculated inside the item processing loop, causing incorrect discount calculations
- **Solution**: Calculate `totalGrossForDiscount` once before processing items
- **Location**: `backend/controllers/TAxnTrnbillControllers.js` - `createKOT` function

## Testing Required
- [ ] Test fixed discount distribution with multiple items
- [ ] Test percentage discount distribution
- [ ] Test tax calculations with different outlet settings
- [ ] Verify database values match frontend display values

## Files Modified
- `backend/controllers/TAxnTrnbillControllers.js`
