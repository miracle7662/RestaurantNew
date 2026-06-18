# TODO

- [ ] Add backend controller method `getAtGlance` in `backend/modules/hotelbooking/controllers/checkInController.js` using provided SQL (room_master + checkin_master + checkin_detail_master + guest_master + company_master) filtered by `rm.hotelid`.
- [ ] Wire a route for the new endpoint (edit `backend/routes/*` if needed).
- [ ] Add frontend service call (extend `src/common/hotel/checkIn.ts` OR call endpoint directly) to fetch at-glance data.
- [ ] Update `src/views/pages/hotel-master/HotelBookingPanel/AtGlancePage.tsx` to use the new endpoint and map fields into `AtGlanceItem`.
- [ ] Ensure status mapping for AtGlance UI (room_status_id from room_master -> RoomStatus string).
- [ ] Run quick build/lint check and verify endpoint response shape.

