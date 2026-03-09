# TODO - Menu.tsx Item Modal Updates

## Task: Keep modal open after saving item, retain dropdown values

### Steps:
1. [x] Read and understand the Menu.tsx code
2. [x] Create plan and get user confirmation
3. [x] Modify handleSubmit to not close modal when adding new item
4. [x] Add logic to reset item-specific fields after save (keep common fields)
5. [x] Keep Item Main Group, Item Group, Kitchen Main Group, Kitchen Category, Kitchen Sub Category after save
6. [x] Only reset these when modal is closed
7. [ ] Test the changes

### Changes Summary:
- In Add mode: After save, don't call onHide()
- RESET after save: Item Name, Print Name, Short Name, Description, HSN Code, Base Price, department rates
- KEEP after save: Outlet, Hotel/Brand, Item Main Group, Item Group, Kitchen Main Group, Kitchen Category, Kitchen Sub Category, Runtime Rates, Is Common to All Departments, Status, Variant Type
- Generate new item number for next item
- Full reset only when modal is closed

