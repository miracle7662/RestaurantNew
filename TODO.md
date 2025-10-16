# TODO: Add Kitchen Group Dropdown to Kitchen Category Modal

## Backend Changes
- [x] Update KitchenCategoryController.js: Add kitchenmaingroupid to addKitchenCategory and updateKitchenCategory methods.

## Frontend Changes
- [x] Update KitchenCategories.tsx: Add state for kitchen groups list.
- [x] Fetch kitchen groups from API on component mount.
- [x] Add Form.Select dropdown in KitchenCategoryModal for selecting Kitchen Group.
- [x] Update modal state to include selected kitchenmaingroupid.
- [x] Update payload in handleSave to include kitchenmaingroupid.
- [x] Update KitchenCategoryItem interface to include kitchenmaingroupid.
- [x] Add Kitchen Group column to the table to display the associated group name.

## Testing
- [ ] Test fetching kitchen groups.
- [ ] Test adding category with selected group.
- [ ] Test editing category with group selection.
