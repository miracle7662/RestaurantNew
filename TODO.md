# TODO: Fix KOT Number Generation Issue

## Overview
The task is to resolve the issue where a new KOT number is not generated when printing and saving a KOT; it always resets to 1. This is due to a field mismatch and uninitialized date in `mstoutlet_settings`. Changes are focused on `backend/controllers/TAxnTrnbillControllers.js` in the `createKOT` function.

## Steps to Complete

### 1. Preparation
- [x] Confirm the database has the necessary fields in `mstoutlet_settings` (e.g., `next_reset_kot_days`, `next_reset_kot_date`). If not, suggest manual SQL to add them (e.g., `ALTER TABLE mstoutlet_settings ADD COLUMN next_reset_kot_days TEXT DEFAULT 'DAILY'; ALTER TABLE mstoutlet_settings ADD COLUMN next_reset_kot_date DATETIME;`).
- [x] Ensure sample data exists for testing (e.g., insert outlet settings if missing). Migration script created.

### 2. Code Edits in `backend/controllers/TAxnTrnbillControllers.js`
- [x] Update the SQL query in `createKOT` to select correct KOT-specific fields: `next_reset_kot_days` and `next_reset_kot_date` (fallback to order_number fields if they don't exist).
- [x] Fix field access: Use `outletSettings?.next_reset_kot_days` consistently.
- [x] Enhance reset logic: Default to 'DAILY' if null; properly compare dates for reset conditions (DAILY, WEEKLY, MONTHLY); update `next_reset_kot_date` on reset.
- [x] Improve KOT number calculation: Always fetch max KOTNo per outlet since last reset (or global if no reset); increment correctly. Assign to all new details.
- [x] Add console logging for debugging: Log reset decision, lastResetDate, maxKOT, and new kotNo.
- [x] Handle missing outlet settings: If no row for outletid, insert default (e.g., 'DAILY', current date).

### 3. Testing and Verification
- [x] Start the server: Run `node backend/server.js` (if not running).
- [x] Test `createKOT` endpoint multiple times via frontend or Postman (e.g., add items to same table, generate KOTs). Verify KOTNo increments (1, 2, 3...).
- [x] Test reset: Manually set `next_reset_kot_date` to past date, generate KOT – should reset to 1 next day/week/month.
- [x] Check DB: Query `TAxnTrnbilldetails` for KOTNo values; ensure they increment properly.
- [x] Run linter: `npm run lint` to check for errors.
- [x] Verify no regressions: Test bill creation, printing, and reversal functions.

### 4. Followup
- [x] If DB fields missing, create a simple migration script (e.g., in `backend/migrations/`).
- [x] Update TODO.md as each step completes.
- [x] Once all done, confirm with user and close task.

**Progress: 4/4 sections complete**
