# TODO: Fix Grouping Logic Bug in Billview.tsx

## Tasks
- [ ] Add originalIndex to DisplayedItem interface
- [ ] Modify displayedItems logic: When isGrouped, group only billed items (isBilled === 1), append unbilled items separately, then add blank editable row
- [ ] Update table inputs to be readOnly based on isEditable
- [ ] Adjust handleItemChange to prevent editing billed items
- [ ] Update handleKeyPress for new logic (row removal in grouped mode)
- [ ] Update handleArrowNavigation for new logic
- [ ] Ensure saving logic handles unbilled items correctly
