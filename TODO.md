# Billview Component Testing Plan

## Testing Status
- **Things I have already tested:** Code compilation, linting, TypeScript checks
- **Remaining areas that still require coverage:** All functional testing areas listed below

## Remaining Testing Areas

### 1. Grouping Functionality
- **Test Case 1.1:** Verify that when `groupBy` is set to 'item', items are grouped by `itemName` in `displayedItems`
- **Test Case 1.2:** Verify that when `groupBy` is set to 'group', items are grouped by `itemgroupid` in `displayedItems`
- **Test Case 1.3:** Verify that when `groupBy` is set to 'kot', items are grouped by `mkotNo` in `displayedItems`
- **Test Case 1.4:** Confirm that grouped items show aggregated quantities and totals
- **Test Case 1.5:** Verify that KOT numbers are collected and displayed as badges in grouped view
- **Test Case 1.6:** Test that special instructions are preserved in grouped items

### 2. Editing Behavior
- **Test Case 2.1:** When `isGrouped` is true, verify that only the last row (blank row) is editable
- **Test Case 2.2:** When `isGrouped` is true, verify that all other rows are read-only
- **Test Case 2.3:** Test input changes in the editable blank row when grouped
- **Test Case 2.4:** Verify that `handleItemChange` uses correct `dataIndex` when grouped
- **Test Case 2.5:** Test that grouped rows cannot be modified directly

### 3. Navigation and Key Presses
- **Test Case 3.1:** Test arrow key navigation in non-grouped view
- **Test Case 3.2:** Test arrow key navigation in grouped view
- **Test Case 3.3:** Test Enter key behavior in `handleKeyPress` for grouped vs non-grouped
- **Test Case 3.4:** Verify `dataIndex` calculation in `handleItemChange` when grouped
- **Test Case 3.5:** Test Backspace key behavior for removing rows in non-grouped view
- **Test Case 3.6:** Verify Backspace is disabled in grouped view

### 4. UI Rendering
- **Test Case 4.1:** Confirm table displays correctly in non-grouped view (all rows editable)
- **Test Case 4.2:** Confirm table displays correctly in grouped view (only last row editable)
- **Test Case 4.3:** Verify KOT badges display correctly in both views
- **Test Case 4.4:** Test special instructions column rendering
- **Test Case 4.5:** Verify totals calculation and display in grouped view

### 5. Integration with Other Features
- **Test Case 5.1:** Test adding new items in grouped view
- **Test Case 5.2:** Test removing items in grouped view (should not be possible)
- **Test Case 5.3:** Verify totals calculation works correctly with grouping
- **Test Case 5.4:** Test discount application with grouped items
- **Test Case 5.5:** Test settlement with grouped items
- **Test Case 5.6:** Verify KOT saving works with grouped items

### 6. Edge Cases
- **Test Case 6.1:** Test with empty bill (no items)
- **Test Case 6.2:** Test with single item in grouped view
- **Test Case 6.3:** Test with multiple items having same name/group/KOT
- **Test Case 6.4:** Test switching between group modes dynamically
- **Test Case 6.5:** Test with mixed KOT numbers
- **Test Case 6.6:** Test with items having no KOT numbers

## Test Execution Steps
1. Start the application with `npm run dev:full`
2. Navigate to Billview component
3. Load a bill with multiple items
4. Test each test case systematically
5. Document any issues found
6. Verify fixes work correctly

## Expected Behavior Summary
- When `groupBy === 'none'`: All rows editable, standard behavior
- When `groupBy !== 'none'`: Only last blank row editable, other rows read-only and show grouped data
- Navigation and input handling should respect the `isGrouped` flag
- Totals and calculations should work correctly in both modes
