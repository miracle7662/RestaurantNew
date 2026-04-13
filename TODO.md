# Fixing Outlet Settings 404 Error

## Current Status
- [x] Analyzed backend routes ✓ exist
- [x] Analyzed controllers ✓ query syntax bug found
- [x] Analyzed frontend ✓ calls correct endpoint

## Plan Steps
1. [ ] **Fix backend query syntax** in outletController.js (getOutletBillingSettings + similar)
2. [ ] Restart backend server & test endpoint
3. [ ] Create src/common/api/outlet.ts OutletService with 404 handling
4. [ ] Update AddOutlet.tsx error handling
5. [ ] Test full flow

**Next Step:** Fix backend controller queries
