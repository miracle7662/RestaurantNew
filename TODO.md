# RestaurantNew Task Tracker
## Current Task: Fix MySQL Transaction Error in outletController.js (backend/TODO.md Plan)

**Status: IMPLEMENTING Step 2**

### Detailed Implementation Steps:
- [x] Step 1: Create/Update TODO.md [COMPLETED]
- [ ] Step 2.1: Fix syntax errors (missing catch/finally blocks ~lines 804,1443)
- [ ] Step 2.2: Convert ALL db.prepare().run()/get() → db.execute(query, params) in addOutlet, updateOutletSettings, etc.
- [ ] Step 2.3: Complete addOutlet transaction: INSERT outlet + 6 settings tables atomically
- [ ] Step 2.4: Fix updateOutletSettings transaction (update/insert logic)
- [ ] Step 2.5: Fix getBrands: Add WHERE status = 1
- [ ] Step 2.6: Standardize remaining functions (updateOutlet, getOutletSettings, etc.)
- [ ] Step 3: Test endpoints & restart server
- [ ] Step 4: Update backend/TODO.md ✅, attempt_completion

**Next Action**: Edit backend/controllers/outletController.js with precise fixes

