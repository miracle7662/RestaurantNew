# Billview.tsx Item Name Auto-fill Fix
Status: [ ] In Progress

## Steps:
[ ] 1. Change itemName input `value` from dynamic formatting to `value={item.itemName}`
[ ] 2. Update `handleItemChange` logic for field==='itemName':
     - Always set currentItem.itemName = value
     - ONLY if value exactly matches menuItems[i].item_name → auto-fill itemCode, itemId, rate
[ ] 3. Keep datalist="itemNames" unchanged
[ ] 4. Test typing (no auto-fill until exact match)
[ ] 5. Test datalist selection (triggers exact match)
[ ] 6. Verify cursor position stable
[ ] 7. attempt_completion

