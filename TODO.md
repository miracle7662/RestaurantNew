# Task: Add Variant Filtering to Billview.tsx

## Objective
When clicking a table in Tableview.tsx and adding items in Billview.tsx, items with variant values for that table's department should show in the dropdown list.

## Analysis Summary

### OrderDetails.tsx Implementation:
1. `getDepartmentPrice` - Gets department-specific prices from `menuItem.department_details`
2. `getDisplayPrice` - Returns department price if available, otherwise base price
3. Filters items by department - only shows items with price for selected department
4. Extracts variants from `menuItem.department_details` filtered by department
5. Shows variants in code dropdown with type 'variant'
6. Uses VariantModal for variant selection on card click

### Billview.tsx Current State:
- Already has VariantModal imported ✅
- Already has VariantOption interface ✅
- Has departmentIdFromState from location.state ✅
- Fetches menu items using MenuService.list() ✅

### Completed Implementation in Billview.tsx:
1. ✅ Added VariantOption interface
2. ✅ Added CodeSearchResult interface
3. ✅ Added helper functions: getDepartmentPrice, getDisplayPrice, hasDepartmentPrice
4. ✅ Updated MenuItem interface to include variants field
5. ✅ Added variant modal states: showVariantModal, selectedItemForVariant, itemVariants
6. ✅ Updated handleItemChange to check for variants and show modal when item has variants
7. ✅ Added VariantModal component to JSX with variant selection handler

## Files Modified
- `src/views/apps/Billview.tsx` - Main implementation

## Testing
- Test table selection in Tableview.tsx
- Test item search in Billview.tsx
- Test variant selection in dropdown
- Test variant modal when clicking item card
