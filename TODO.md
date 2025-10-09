# TODO: Fix DayEnd outletid, hotelid, createdbyid default values

## Tasks
- [x] Update User type in useAuthContext.tsx to include outletid and hotelid
- [x] Modify DayEnd.tsx to use user?.outletid and user?.hotelid instead of hardcoded 1
- [x] Ensure created_by_id uses user?.userid properly
- [ ] Test the dayend save functionality
