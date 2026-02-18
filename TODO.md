# Split Table Functionality Implementation

## Task Summary
Implement split table functionality in Restaurant POS. When Table 2 is already occupied and printed, pressing F6 (New Bill) should create sub-tables like 2A, 2B, 2C dynamically. These should be stored as temporary child tables in TableManagement with ParentTableId reference. Each sub-table must support independent KOT and billing. When all sub-tables are closed, parent table should auto set to Available and temporary records cleaned up.

## Implementation Steps

### Step 1: Database Schema Changes
- [ ] Add `parentTableId` column to `msttablemanagement` table
- [ ] Add `isTemporary` column to mark temporary sub-tables

### Step 2: Backend Changes (TableManagementController.js)
- [ ] Add createSplitTable endpoint - create new split table with parent reference
- [ ] Add getSubTables endpoint - get all sub-tables for a parent table
- [ ] Add checkAndCleanupSubTables endpoint - check if all sub-tables are settled and cleanup
- [ ] Update routes to include new endpoints

### Step 3: Frontend Updates (Tableview.tsx)
- [ ] Add F6 key handling for new bill mode in Tableview
- [ ] Update generateAndCreateSplitTable to use backend API
- [ ] Add refresh table logic after split table operations

### Step 4: Integration with Billing
- [ ] Ensure sub-tables can create independent KOT
- [ ] Ensure sub-tables can be billed independently
- [ ] Handle parent table status update when all sub-tables settled
