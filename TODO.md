# TODO - Billview billed items edit lock

## Steps
- [ ] Update `src/views/apps/Billview.tsx`:
  - [ ] Compute `hasBilledItems` / `isBilledLocked` helper
  - [ ] Ensure `displayedItems` marks rows non-editable when `item.isBilled === 1` (including existing billed lines)
  - [ ] Add hard guard in `handleItemChange` to prevent edits when target row has `isBilled === 1`
  - [ ] Ensure input/new row remains editable so user can add new items after reopen and then print KOT only for new items
- [ ] Run TypeScript/lint check (if scripts exist)
- [ ] Manual test flow:
  1) Add items (isbilled=0) → KOT print
  2) Print bill (isbilled becomes 1 for old items)
  3) Reopen billview → old items visible but locked
  4) Add new item (isbilled=0) → KOT print works

