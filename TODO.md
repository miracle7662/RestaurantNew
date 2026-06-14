# TODO - Hotel Multi-Room Check-in Fix

- [ ] Update `CheckInForm.tsx` to auto-add `roomRows` for all rooms passed from `HotelBookingPanel` (from `location.state.rooms`) when form loads.
- [ ] Ensure auto-add runs only once (or only when `roomRows.length === 0`) to avoid overwriting manual edits.
- [ ] After auto-add, ensure `roomNo`/type fields don’t break Formik flow.
- [ ] Validate: selecting 3 rooms → pressing F9 creates check-in for all 3 rooms.

