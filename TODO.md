# TODO - Billview Item Name with Variant

## Task
When typing in the item name dropdown, show item name with variant value and apply variant-specific rate when selected.

## Steps to Complete:
1. [x] Read and understand the current Billview.tsx implementation
2. [ ] Update handleItemChange function to parse variant from itemName selection
3. [ ] Apply variant-specific rate when variant is selected from dropdown
4. [ ] Test the implementation

## Changes Needed:
- File: src/views/apps/Billview.tsx
- Function: handleItemChange
- Logic: When itemName field is changed, parse the value to extract:
  - Base item name (before ' (')
  - Variant name (inside parentheses if present)
  - Match with menu items and apply variant-specific rate from department_details

