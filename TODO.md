# TODO: Fix KOT Save Issue for New Items

## Problem
When adding new items to the same table after the first "Print & Save KOT", the new items are not inserted into the backend. This is because the `id` field in the frontend `MenuItemState` is incorrectly set to `items.length + 1` instead of the actual database `ItemID`.

## Root Cause
- In `OrderDetails.tsx`, when adding new items, the `id` is assigned as `items.length + 1`, which doesn't match the database `ItemID`.
- The backend uses `ItemID` to check for existing items in the KOT, so incorrect `id` prevents proper insertion/update.

## Solution Steps
1. Update `handleAddItem` function interface to accept `id` in `newItem`.
2. Modify calls to `handleAddItem` to pass the correct `id` from `matchedItem.userId` or `item.userId`.
3. Remove incorrect `id` assignment in `handleAddItem` since it's now provided.

## Files to Edit
- `src/views/apps/Transaction/OrderDetails.tsx`

## Followup Steps
- Test the fix by adding items to a table, saving KOT, adding more items, and saving KOT again.
- Verify that new items are inserted correctly in the backend.
- Check that increasing quantity of existing items also works.
