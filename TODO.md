# Automatic KOT Printing Implementation - TODO

## Status: In Progress

### Step 1: [COMPLETED] DB Migration
- Create and run SQL migration to add `printed` flag to `TAxnTrnbilldetails`
- Files: `backend/migrations/auto_print_migration.sql`

### Step 2: [PENDING] Update printController.js
- Add `getPrinterConfig(outletId)`
- Add `printKOTByOrder(txnId, outletId)`
- Make config dynamic

### Step 3: [PENDING] Add order creation API
- `backend/controllers/ordersController.js`: `createOrder()`
- `backend/routes/ordersRoutes.js`: POST `/orders`

### Step 4: [PENDING] Create printService.js
- Background poller every 5s for new KOTs
- Auto-print and mark as printed

### Step 5: [PENDING] Integrate to server.js
- Start printService on startup

### Step 6: [COMPLETED] Test & Verify
- Test order creation → auto-print
- Check logs/DB/printer

---

**Next Step:** DB Migration
