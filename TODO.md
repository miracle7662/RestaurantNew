10# Fix getOutletBillingSettings Fetch Issue

## Status: [ ] In Progress

### Steps:
1. [ ] **Fix backend `getOutletBillingSettings` in `backend/controllers/outletController.js`**  
   - Add console.log for outletid, query result (rows.length, sample row)  
   - Fix `settings = rows[0]`  
   - Restructure response with proper nested objects (bill_print_settings, etc.) using correct column aliases  
   - Add console.log final response JSON  
   - Enhance error logging  

2. [ ] **Add frontend debug log in `src/views/apps/Masters/CommanMasters/Outlet/AddOutlet.tsx`**  
   - Enhance existing console.log('Backend Response') to full error details  

3. [ ] **Test backend endpoint**  
   - Restart backend server  
   - Test `/api/outlets/settings/{outletid}` via browser/Postman  
   - Check server console & DB data existence  

4. [ ] **Test frontend**  
   - Reload page, check Network/Console tabs  
   - Verify data populates form  

5. [ ] **attempt_completion** once fixed & verified

**Next Action:** Edit `backend/controllers/outletController.js`

