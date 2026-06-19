# TODO — Arrivals page: switch from Reservations to Check-Ins

- [ ] Implement new data fetching in `src/views/pages/hotel-master/HotelBookingPanel/Arrivals.tsx`:
  - [ ] Replace `ReservationService` and `ReservationRoomService` calls with `CheckInService` and `DetailService`.
  - [ ] Filter checkins where `DATE(checkin_datetime) === selected date` and `status === 'active'`.
  - [ ] Ensure room-wise rows are built using `DetailService` (join by `checkin_id`) and use only active details (exclude `is_checkout === 1` if present).
- [ ] Update table columns and row mapping to required set:
  - [ ] Reg No, Guest Name, Mobile No, Room No, Room Category, Check-In Date & Time, Total Days, Pax Count, Extra Pax Count, Child Count, Room Tariff, Total Amount.
- [ ] Keep UI/UX requirements:
  - [ ] Maintain date picker (default today) and hotelid filtering.
  - [ ] Keep existing responsive table styling.
  - [ ] Keep Export to Excel, PDF, Print functionality; update exported fields/headers to match new columns.
- [ ] Run typecheck/lint/build (if available) to ensure TS correctness.

