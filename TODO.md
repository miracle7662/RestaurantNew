# Multi-Tenant Isolation Implementation - TODO.md

## Approved Plan Progress
**✅ PLAN APPROVED** - Proceed with middleware + controller fixes

## Breakdown Steps (10 total)
```
✅ 1. [DONE] Create robust enforceHotelIsolation middleware in backend/middleware/auth.js
   ├── Auto-set req.effectiveHotelId = req.hotelid for hotel_admin
   ├── Reject query param override attempts (security)
   └── Log violations

🔄 2. [IN PROGRESS] Update backend/server.js - Chain enforceHotelIsolation after authenticateToken
   └── All protected routes auto-protected

🔄 3. [PENDING] Fix backend/controllers/menuExportController.js 
   ├── req.query.hotelid → req.hotelid (enforced=3)
   └── Test export only shows hotelid=3 data

🔄 4. [PENDING] Fix backend/controllers/mstrestmenuController.js 
   ├── Same pattern fix
   └── getAllMenuItems respects req.hotelid

🔄 5. [PENDING] Fix backend/controllers/settingsController.js
   ├── Use req.user?.hotelid consistently
   └── Printer settings scoped to hotelid=3

🔄 6. [PENDING] Audit & fix remaining controllers (search_files "req.query.hotelid")
   ├── CustomerController.js, ordersController.js, etc.

🔄 7. [PENDING] Frontend services: Default hotelid=user.hotelid (defensive)
   └── src/services/outletSettings.service.ts + others

🔄 8. [PENDING] Test security:
   ├── Login hotel_admin → Try ?hotelid=1 → Expect 403
   ├── Verify data scoped to hotelid=3 only

🔄 9. [PENDING] Performance: Add indexes if needed (hotelid columns)
   └── EXPLAIN queries on mstrestmenu, mst_outlets

🔄 10.[PENDING] attempt_completion + demo commands
```

**Current Progress**: Step 2 (server.js)  
**Completed**: Step 1  
**Next**: Step 3 (menuExportController.js)
