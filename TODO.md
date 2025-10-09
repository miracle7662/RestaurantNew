# Task: Support Multiple Payment Types in Settlement

## Steps:

### 1. Database Migration
- Create a new table `TrnSettlementPaymentTypes` with columns:
  - `ID` (Primary Key)
  - `SettlementID` (Foreign Key to TrnSettlement)
  - `PaymentType` (string)
  - `Amount` (decimal) - optional if needed to track amounts per payment type

### 2. Backend Updates (backend/controllers/settlementController.js)
- Modify `getSettlements`:
  - Join `TrnSettlementPaymentTypes` to aggregate multiple payment types per settlement.
  - Return payment types as a comma-separated string or array in the API response.
- Modify `updateSettlement`:
  - Update multiple payment types in `TrnSettlementPaymentTypes` table.
  - Handle amounts per payment type if applicable.
- Modify `deleteSettlement`:
  - Handle deletion or soft deletion of related payment types.

### 3. Frontend Updates (src/views/apps/Transaction/Settlement.tsx)
- Update settlement table to display multiple payment types as badges or comma-separated strings.
- Update edit modal:
  - Allow selecting multiple payment types.
  - Allow entering amounts per payment type.
- Update save logic to send multiple payment types and amounts to backend.

### 4. Testing
- Test full flow: fetch, display, edit, update, and delete settlements with multiple payment types.

---

I will start with the database migration script next.
