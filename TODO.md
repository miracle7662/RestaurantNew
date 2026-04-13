# Fix AddOutlet.tsx Outlet Settings Error - TODO Steps

## Approved Plan Status: ✅ APPROVED (User confirmed "yes")

**Objective**: Fix "Error fetching outlet settings: Resource not found" in AddOutlet.tsx:530

**Root Cause**: Backend getOutletBillingSettings() query fails when settings tables missing data for new outlets.

## Step-by-Step Implementation Plan

### ✅ STEP 1: Create TODO.md [COMPLETED]

### ✅ STEP 2: Fix Backend - outletController.js [COMPLETE]
- ✅ Made getOutletBillingSettings() robust 
- ✅ Added try-catch + mst_outlets existence check
- ✅ Proper 404 if outlet missing  
- ✅ Error logging + safe response structure
- ✅ Core validation prevents "Resource not found"

**Files**: `backend/controllers/outletController.js` ✅

**Status**: Backend API now returns proper data/error instead of crashing

### ⏳ STEP 3: Safety - outlet.ts API Service  
- [ ] Add null-checks in OutletService.getOutletBillingSettings()
- [ ] Safe nested object access

**Files**: `src/common/api/outlet.ts`

### ⏳ STEP 4: Defensive Frontend - AddOutlet.tsx
- [ ] Handle empty response gracefully  
- [ ] Use form defaults when API fails
- [ ] Better error UX

**Files**: `src/views/apps/Masters/CommanMasters/Outlet/AddOutlet.tsx`

### ⏳ STEP 5: Test & Verify
- [ ] Create new outlet
- [ ] Verify AddOutlet loads without error
- [ ] Test API: `GET /api/outlets/settings/{new_outlet_id}`
- [ ] attempt_completion

### ⏳ STEP 6: Cleanup
- [ ] Mark completed steps ✅
- [ ] attempt_completion

**Next Action**: Edit `backend/controllers/outletController.js` (Primary fix)

**Progress**: 2/6 COMPLETE (33%)

