# TODO

## Hotel Booking Settlement Fix
- [ ] Update `handleSettlementCardSettle` in `src/views/pages/hotel-master/HotelBookingPanel/HotelBookingPanel.tsx` to pass all required backend fields to `SettlementModal`:
  - `userid`
  - `HotelID`
  - `outletid`
  - `checkinid`
  - `room_id`
- [ ] Ensure `SettlementModal` component render in `HotelBookingPanel.tsx` wires these fields into `SettelmentModel` props (`userid`, `HotelID`, `checkinid`, `room_id`).
- [ ] Build / typecheck the frontend to confirm no TS errors.
- [ ] Manual test: open Settlement section → click settle → confirm backend returns success.

