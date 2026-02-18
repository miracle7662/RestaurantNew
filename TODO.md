# Sub-Table Implementation Plan

## Tasks:
1. [x] Read subtable API file to understand frontend integration
2. [ ] Add SubTable Selection Modal to Billview.tsx
3. [ ] Add state variables for sub-table handling
4. [ ] Add ESC key handler to cancel sub-table creation
5. [ ] Update settlement handler to release sub-tables
6. [ ] Test the implementation

## Implementation Details:

### 1. Sub-Table Modal
- Show when clicking on a table to create new bill
- Display sub-tables (2A to 2Z) for the selected parent table
- Allow user to select a sub-table
- ESC key should close modal without creating table

### 2. Settlement Handling
- When settling a bill that has a sub-table
- Call the release sub-table API
- This will remove the sub-table and free it for reuse
