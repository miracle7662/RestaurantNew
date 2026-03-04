# TODO - Column Selection for Multiple Price Tab

## Task: Select Variant Type → Small Modal Opens → Checkbox list of variant values → User selects values → Click Apply → Table shows selected columns only

### Steps:
- [x] 1. Read and understand the current Menu.tsx implementation
- [x] 2. Add state for selected variant values (checkboxes)
- [x] 3. Create a small Modal component for checkbox list of variant values
- [x] 4. Add a button to open the modal (next to Select Variant Type dropdown)
- [x] 5. Update the table columns in Multiple Price tab to show only selected columns
- [x] 6. Test the implementation

### Implementation Details:
- Add `selectedVariantValues` state (array of selected variant value IDs)
- Add `showVariantValueModal` state for controlling modal visibility
- Create a small Modal with checkboxes for variant values
- Add "Select Columns" button that opens the modal
- Filter table columns based on selected variant values

### Status: ✅ COMPLETED

