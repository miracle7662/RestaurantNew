# TODO - Partial checkout multi-room fix (Occupied tab)

- [x] Step 1: Fix backend `checkoutController.js` to store/bind room_no/room_id for **all** `checked_out_rooms` (no `[0]` only).

- [ ] Step 2: For partial checkout, create room-wise bill/cleaning updates only for **selected room numbers**.
- [ ] Step 3: Ensure `room_master` update uses `room_no IN (selectedRooms)` (not `checkin_id`).
- [ ] Step 4: Ensure bill rooms expose `ldg_bill_no` per room.
- [ ] Step 5: Update frontend `HotelBookingPanel.tsx` Occupied tab to show both: `occupied` + `bill`.
- [ ] Step 6: Update frontend bill tile rendering to display `ldg_bill_no`.
- [ ] Step 7: Manual test: 6 rooms check-in; settlement checkout for 401 & 402; verify both show in Occupied tab; verify remaining 403-406 show occupied.

