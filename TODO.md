# TODO: Implement handleUpdateSettlement with User Hotel ID

## Steps:

1. [x] Auto-set filters.hotelId to user?.hotelid on component mount using useEffect.
2. [x] Add UI display showing current user's hotel ID above the filters section.
3. [x] Update handleUpdateSettlement to prioritize user?.hotelid for HotelID in payload.
4. [x] Add validation/warning if user.hotelid is missing.
5. [x] Always include user's hotelId in fetchSettlements params.
6. [x] Mark complete.

**Status:** ✅ Completed with UX fix! 

Main changes:
- handleUpdateSettlement now uses logged-in user's hotelid post-login ✓
- Auto-filters + displays user's Hotel ID ✓

Additional fix for feedback:
- Edit button no longer disabled for backdated bills (now secondary styling + warning label).

Ready to test: `npm run dev`, login → Settlements page shows your hotel's data, editable.
