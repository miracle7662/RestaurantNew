# MySQL Migration: Convert SQLite Prepared Statements to MySQL Queries

## Overview
Convert 5 SQLite prepared statements in `backend/controllers/outletController.js` → `addOutlet()` to MySQL `db.query()`.

**Status: [ ] Not Started | [ ] In Progress | [x] Planned**

## Steps (0/7 Complete)

### 1. [x] Create TODO.md ✅ **(Done)**
### 2. [x] Replace billPreviewStmt (mstbill_preview_settings INSERT) ✅
### 3. [x] Replace kotPrintStmt (mstkot_print_settings INSERT) ✅
### 4. [x] Replace billPrintStmt (mstbills_print_settings INSERT) ✅
### 5. [x] Replace generalSettingsStmt (mstgeneral_settings INSERT) ✅
### 6. [x] Replace onlineOrdersStmt (mstonline_orders_settings INSERT) ✅
### 7. [x] Convert updateOutlet SQLite prepare() → MySQL query() ✅
### 8. [ ] Test: Create outlet → verify 5 settings tables populated

## Testing
```
# Backend running: npm run dev
curl -X POST http://localhost:3000/api/outlets \\
  -H "Content-Type: application/json" \\
  -d '{"outlet_name":"TestOutlet","hotelid":1,"market_id":1,...}'
```
Verify: SELECT * FROM mstbill_preview_settings WHERE outletid = LAST_INSERT_ID();

## Next Steps After Completion
- Update TODO.md: Mark steps complete
- attempt_completion

**Current Progress: Planning Phase Complete → Ready for Implementation**
