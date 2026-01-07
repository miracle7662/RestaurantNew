# Fix Reverse KOT Fetch Issue

## Information Gathered
- ReverseKotModal receives `kotItems` as props from Billview.tsx, which is `billItems`.
- `revKotNo` is hardcoded to 21 in Billview.tsx.
- Modal shows all billItems, but for reverse KOT, it should show only items from the specific KOT.
- For billed bills, `revQty` is set from API, showing already reversed quantities.
- For unbilled, `revQty` is 0.

## Plan
1. Make `revKotNo` dynamic in Billview.tsx: Set it to `editableKot` or `defaultKot` when opening the modal.
2. In ReverseKotModal, filter `kotItems` to show only items where `mkotNo` includes the `revKotNo`.
3. Filter out blank rows (items with itemId <= 0 or qty <= 0).
4. Test the modal to ensure items are fetched correctly.

## Dependent Files
- src/views/apps/Billview.tsx
- src/views/apps/ReverseKotModal.tsx

## Followup Steps
- Test the reverse KOT modal after changes.
- Ensure API returns correct data for billed/unbilled items.
