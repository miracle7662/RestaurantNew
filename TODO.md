# TODO - Hotel Booking Checkout → Room Status + Bill

- [ ] Step 1: Add backend logging + guard in `backend/modules/hotelbooking/controllers/checkoutController.js` to confirm:
  - payload `selected_rooms` received
  - computed `roomsToCheckout` (room_number/room_id)
  - that the loop updating `room_master` with `room_status='bill'` runs for the expected rooms
- [ ] Step 2: Implement backend fixes if selection/update logic is incorrect (based on Step 1 logs)
- [ ] Step 3: Update frontend “room tiles / RoomStatus” refresh after checkout so UI shows updated `bill` status
- [ ] Step 4: Test checkout flow end-to-end (partial + full checkout) and verify room status + bill show

