# Dynamic Sub-Table Creation Implementation Plan

## Overview
Implementation of dynamic sub-table creation and proper order lifecycle management in restaurant billing system.

## Requirements Summary
1. When user clicks on main table (e.g., Table 2) and selects "New Bill", generate sub-tables: 2A, 2B, 2C...2Z
2. Sub-tables linked to parent table
3. Initially status: unbilled
4. Only save to DB when Save KOT is clicked
5. ESC/Cancel = no table created
6. Settlement = remove/reset sub-table
7. Prevent duplicate sub-table creation
8. Atomic transactions

## Implementation Steps

### Phase 1: Database Schema Changes
- [x] 1.1 Create sub-table management table (mst_sub_tables)
- [x] 1.2 Add parent_table_id foreign key to msttablemanagement
- [x] 1.3 Create migration for new table

### Phase 2: Backend API Development
- [x] 2.1 Create SubTableController.js
  - [x] getSubTablesByParent - Get all sub-tables for a parent table
  - [x] createSubTable - Create a new sub-table
  - [x] getAvailableSubTable - Get next available sub-table
  - [x] updateSubTableStatus - Update sub-table status
  - [x] releaseSubTable - Release/reset sub-table on settlement
- [x] 2.2 Create SubTableRoutes.js
- [ ] 2.3 Update TableManagementController to handle sub-tables
- [ ] 2.4 Update TAAxnTrnbillControllers for sub-table integration

### Phase 3: Frontend Integration
- [ ] 3.1 Update TableView to show sub-tables
- [ ] 3.2 Add sub-table selection UI
- [ ] 3.3 Update BillView for sub-table handling
- [ ] 3.4 Add ESC/Cancel handling for temporary tables

### Phase 4: Order Lifecycle Management
- [ ] 4.1 Update saveKOT to handle sub-tables
- [ ] 4.2 Update settlement logic to release sub-tables
- [ ] 4.3 Add duplicate prevention logic
- [ ] 4.4 Add atomic transactions

## Completed Tasks ✅
- Created backend/migrations/create_sub_tables.js - Migration file
- Created backend/controllers/SubTableController.js - Controller with all API endpoints
- Created backend/routes/SubTableRoutes.js - Routes file
- Updated backend/server.js - Added import and route registration

## API Endpoints Available
- GET /api/sub-tables/:parentTableId - Get all sub-tables for a parent table
- GET /api/sub-tables/available/:parentTableId - Get available sub-tables
- GET /api/sub-tables/next-available/:parentTableId - Get next available sub-table
- GET /api/sub-tables/by-id/:id - Get sub-table by ID
- GET /api/sub-tables/by-name/:tableName - Get sub-table by name
- POST /api/sub-tables - Create new sub-table
- POST /api/sub-tables/initialize/:parentTableId - Initialize all sub-tables
- PUT /api/sub-tables/:id/status - Update sub-table status
- PUT /api/sub-tables/:id/kot - Link KOT to sub-table
- DELETE /api/sub-tables/:id/release - Release sub-table
- DELETE /api/sub-tables/:id - Delete sub-table

## Database Schema

### New Table: mst_sub_tables
```
sql
CREATE TABLE IF NOT EXISTS mst_sub_tables (
  sub_table_id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_table_id INTEGER NOT NULL,
  sub_table_name TEXT NOT NULL, -- e.g., '2A', '2B', '2C'
  outletid INTEGER NOT NULL,
  status INTEGER DEFAULT 0, -- 0: available, 1: running/unbilled, 2: billed, 3: settled
  kot_id INTEGER, -- FK to TAxnTrnbill.TxnID
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME,
  FOREIGN KEY (parent_table_id) REFERENCES msttablemanagement(tableid),
  FOREIGN KEY (outletid) REFERENCES mst_outlets(outletid),
  UNIQUE(parent_table_id, sub_table_name)
);
```

### Status Values
- 0: available (not in use)
- 1: running/unbilled (KOT saved but not billed)
- 2: billed (bill printed)
- 3: settled/available again (after settlement)

## API Endpoints

### GET /api/sub-tables/:parentTableId
Get all sub-tables for a parent table

### GET /api/sub-tables/available/:parentTableId
Get next available sub-table

### POST /api/sub-tables
Create a new sub-table

### PUT /api/sub-tables/:id/status
Update sub-table status

### DELETE /api/sub-tables/:id
Release a sub-table (reset to available)

## Key Considerations
1. Sub-tables should be generated dynamically (2A-2Z) based on parent table name
2. Use database transactions for atomic operations
3. Prevent duplicate sub-table creation using UNIQUE constraint
4. Handle ESC key to cancel without saving
5. Update parent table status when sub-table is in use
