# Billview.tsx Fixes for Tax and RevKOT Values

## Issue
After printing the bill in Billview.tsx, CGST (+), SGST (+), IGST (+), CESS (+), Rev KOT(+) values are not fetching properly.

## Fixes Applied

### 1. ✅ Uncommented totalRevKotAmount calculation
- Uncommented the useMemo hook that calculates the total amount of reversed items
- This ensures RevKOT displays the correct total value instead of 0

### 2. ✅ Updated RevKOT display in summary table
- Changed the display from `RevKOT.toFixed(2)` to `totalRevKotAmount.toFixed(2)`
- Now shows the actual total of reversed item amounts

### 3. ✅ Added tax value extraction for billed bills
- Added code to set CGST, SGST, IGST, CESS from the header data when loading billed bills
- Previously, tax values were not being populated from the API response for already billed transactions

## Testing Required
- Test bill printing functionality to ensure tax values display correctly after printing
- Verify RevKOT shows correct total for reversed items
- Check that IGST and CESS are properly loaded for billed bills (if applicable)

## Files Modified
- src/views/apps/Billview.tsx
