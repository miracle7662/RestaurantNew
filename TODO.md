 # Fix trn_gstno field not fetching - Progress Tracker

## ✅ Step 1: Fix backend/controllers/outletController.js
- Added trn_gstno to destructuring (now accepts from frontend)
- Backend ready to save trn_gstno string in mstbills_print_settings

## [ ] Step 2: Fix src/common/api/outlet.ts  
- Add trn_gstno?: string to OutletPayload
- Fix BillPrintSettings trn_gstno: string

## [ ] Step 3: Fix src/views/apps/Masters/CommanMasters/Outlet/AddOutlet.tsx
- Change trn_gstno to string/text input
- Fix formData init/mapping/payload to string
- Update UI from checkbox to input field

## [ ] Step 4: Test & Verify
- Restart backend: cd backend && node server.js
- Create outlet with trn_gstno → check DB
- Verify fetch in AddOutlet form
- Test update

## Status: Starting implementation...

