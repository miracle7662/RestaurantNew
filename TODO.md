# TODO - Show Variants in Code Dropdown

## Task
When user types Item Code in the search bar, if that item has multiple variants (Half / Full / Bar / etc.), the dropdown should show all variants instead of only the base item.

## Steps
- [x] 1. Add state variables for code dropdown (showCodeDropdown, selectedCodeIndex)
- [x] 2. Create interface for code search results with variant info
- [x] 3. Modify filterDropdownItems to support 'code' type
- [x] 4. Update handleCodeChange to find all matching items and extract variants
- [x] 5. Add code dropdown UI in the JSX
- [x] 6. Add keyboard navigation for code dropdown (handleCodeKeyDown)
- [x] 7. Test the implementation

