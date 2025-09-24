# TODO: Reverse Qty Implementation

## Information Gathered:
- Current implementation in `handleF8KeyPress` and `reverseQuantity` updates `RevQty` in the existing row, which aligns with "Update same row only" and "Never insert new row".
- However, it does not generate a new KOT number for reversals.
- `createKOT` generates a new KOT number by finding the max KOTNo and incrementing it.

## Plan:
- Modify `handleF8KeyPress` and `reverseQuantity` functions in `backend/controllers/TAxnTrnbillControllers.js` to:
  - Generate a new KOT number for each reversal.
  - Update the existing row with the new KOT number and incremented RevQty.
  - Ensure no new rows are inserted.
- Add logic to generate a new KOT number similar to `createKOT`.

## Dependent Files to be Edited:
- `backend/controllers/TAxnTrnbillControllers.js`: Update the reversal functions.

## Followup Steps:
- Test the changes to ensure reversals work correctly.
- Verify that KOT numbers are generated properly and no new rows are inserted.
- Run tests like `test_reverse_kot.js` to validate the implementation.
