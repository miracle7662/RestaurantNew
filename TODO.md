# TODO - Single API for HotelBookingPanel floors+categories+rooms

## Backend
- [x] Add controller: `getHotelBookingMeta` in `backend/modules/hotelbooking/controllers/roomController.js`
- [x] Add route: `GET /rooms/hotelbooking-meta` in `backend/modules/hotelbooking/routes/roomRoutes.js`


## Frontend
- [x] Add API method in `src/common/hotel/room.ts` (e.g., `getHotelBookingMeta`)
- [ ] Update `HotelBookingPanel.tsx` to call single API and remove 3 parallel calls


## Test
- [ ] Run backend (or lint/build) and verify panel loads correctly
- [ ] Verify grouping by floor and category still works

