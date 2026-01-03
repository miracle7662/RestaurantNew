# KotTransfer Component Enhancements

## Overview
Implement dynamic KOT loading based on selected source table, with item listing controlled by selected KOT, and destination showing only available tables.

## Tasks
- [x] Add new state variables: availableKOTs, selectedKOT, allItems
- [x] Modify fetchItemsForTable to set allItems for source table
- [x] Add updateSelectedItems function and useEffect to filter items based on selectedKOT and transferType
- [x] Update handleSelectedTableChange to populate KOT dropdown and reset selection
- [x] Modify initial useEffect to fetch KOTs for default table
- [x] Change source KOT field to conditional Form.Select (All KOTs for table mode, dropdown for KOT mode)
- [x] Update destination table dropdown to show only available tables
- [x] Adjust initial proposed table selection to use available status
- [ ] Test the functionality

## Key Changes
- KOT dropdown populated with "All KOTs" option and specific KOT numbers from selected table
- Items filtered based on selected KOT in KOT mode, all items shown in table mode
- Destination table dropdown limited to tables with 'available' status
- Source KOT field changed from read-only control to interactive Form.Select

## Implementation Details
- Added state management for KOT selection with special handling for "All KOTs" (-1 value)
- Updated item filtering logic to respond to KOT selection changes
- Modified destination table filter to only show available tables
- Maintained existing transfer logic while adding KOT-specific functionality
