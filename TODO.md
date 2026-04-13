# Brand.tsx Status Null Fix - TODO

## Approved Plan Steps:
- [x] Step 1: Update backend HotelMastersController.js - Add status validation/default=0 in addHotelMasters & updateHotelMasters
- [x] Step 2: Update frontend Brand.tsx - Add payload safeguard `status: statusValue ?? 0` in HotelMastersModal.handleSubmit
- [x] Step 3: Update frontend Brand.tsx table cell - Robust null-handling: `statusVal ?? 0`
- [ ] Step 4: Test creation → verify status shows "Active", no null
- [ ] Step 5: attempt_completion

**Current Progress:** Steps 1-3 complete. Ready for testing.

