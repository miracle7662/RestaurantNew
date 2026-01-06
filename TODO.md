# TODO: Modify displayedItems in Billview.tsx

## Tasks
- [x] Modify displayedItems logic to group only billed items (isBilled === 1) and append unbilled items separately
- [x] Update table rendering to make billed items read-only and keep unbilled items editable
- [x] Adjust handleItemChange to allow editing only unbilled items and blank row
- [ ] Update handleKeyPress and handleArrowNavigation for new logic
- [ ] Ensure saving logic handles unbilled items correctly
- [ ] Add originalIndex to DisplayedItem interface and set in displayedItems
- [ ] Fix dataIndex calculation in handleItemChange using originalIndex
- [ ] Update handleKeyPress for row removal in grouped mode
- [ ] Add readOnly to all inputs based on isEditable
