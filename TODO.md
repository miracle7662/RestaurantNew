# Fix POST /api/outlets 500 Error - Approved Plan

**Current Status:** [In Progress]  
**Files:** backend/controllers/outletController.js  

## Planned Steps:
- [ ] 1. Fix mstbills_print_settings INSERT (match ~55 columns exactly)
- [ ] 2. Fix mstgeneral_settings outletid (use inserted outletId)
- [ ] 3. Add FK validation (hotelid, warehouseid, market_id)
- [ ] 4. Restore console.error logging for debugging
- [ ] 5. Add input validation for required fields
- [ ] 6. Test endpoint & verify database
- [ ] 7. Update this TODO with results

**Next:** Edit outletController.js → Step 1-2 parameter fixes
