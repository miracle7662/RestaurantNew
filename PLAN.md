# Plan: Implement Dropdown for Item Name in Billview.tsx

## Information Gathered
- **Billview.tsx**: Current implementation uses a simple `<datalist>` for item names, which provides basic autocomplete but not a proper dropdown experience
- **OrderDetails.tsx**: Has a custom dropdown implementation with:
  - State variables: `showNameDropdown`, `selectedNameIndex`, `nameSearchResults`
  - Handler: `handleNameChange` - builds search results dynamically
  - Handler: `handleNameKeyDown` - handles keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  - Custom dropdown UI with filtered results

## Plan
1. Add state variables for dropdown management in Billview.tsx:
   - `showNameDropdown` (boolean)
   - `selectedNameIndex` (number)
   - `nameSearchResults` (array)

2. Add `handleNameChange` function to filter menu items based on input

3. Add `handleNameKeyDown` function for keyboard navigation

4. Update the item name input to use custom dropdown instead of datalist

5. Add CSS for the dropdown styling

## Dependent Files to be edited
- `src/views/apps/Billview.tsx`

## Followup steps
- Test the dropdown functionality
- Verify keyboard navigation works (Arrow keys, Enter to select, Escape to close)

