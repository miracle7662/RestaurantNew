# TODO: Fix Minus Button Not Enabling After Password Verification

## Task Analysis
After password verification (F8), the minus button for item reversal is not enabling.

## Root Cause Analysis
1. The `handleF8PasswordSubmit` function sets `reverseQtyMode(true)` correctly
2. However, after password verification, there may be issues with:
   - `sourceTableId` being null/undefined when calling refreshItemsForTable
   - The API response not returning correct `originalQty` values
   - UI state not updating even when reverseQtyMode is true

## Fix Plan

### Step 1: Add Debug Logging
- Add console.log to track `reverseQtyMode` state after password verification
- Log the `sourceTableId` value being passed to refreshItemsForTable

### Step 2: Update handleF8PasswordSubmit
- Ensure `sourceTableId` is properly set before calling refreshItemsForTable
- Add fallback logic to get tableId from `persistentTableId` if `sourceTableId` is not available

### Step 3: Verify Item Loading
- Check that `refreshItemsForTable` correctly loads items with originalQty values
- Ensure items are displayed with correct quantity after refresh

## Files to Edit
1. `src/views/apps/Transaction/Orders.tsx` - Update handleF8PasswordSubmit function

## Follow-up Steps
1. Test the F8 functionality on a billed table
2. Verify minus button becomes enabled after password verification
