# Task: Fix RevKOTNo display in ReverseKotModal table

## Issue
RevKOTNo details were not fetching/displaying in the table within ReverseKotModal.tsx. The table was showing original KOT numbers instead of reverse KOT numbers for reversed items.

## Changes Made
- [x] Added `revKotNo?: number;` to BillItem interface in Billview.tsx
- [x] Modified ReverseKotModal.tsx to initialize items with revKotNo from item data
- [x] Updated table display logic to show RevKOTNo (red badge) if available, otherwise original KOT numbers

## Result
The table now correctly displays RevKOTNo for reversed items, allowing users to see the reverse KOT number in the table as expected.
