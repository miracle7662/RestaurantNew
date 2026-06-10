# TODO - Hotel settlement missing details fix

- [x] Update `SettelmentModel.tsx` to log which required settlement fields are missing before failing validation.

- [ ] Update `HotelBookingPanel.tsx` settlement handler to ensure `userid`, `HotelID`, `outletid`, `checkinid`, and `room_id` are always correctly resolved.
- [ ] Run frontend build / typecheck (if available) and perform quick manual test of settlement flow.

