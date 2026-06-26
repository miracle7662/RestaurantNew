# TODO

- [ ] Refactor `fetchData()` in `src/views/pages/hotel-master/HotelBookingPanel/RoomDetailSummary.tsx` to remove frontend reconstruction logic.
- [ ] Ensure `rows` is the sole source: `const rows = fullDetailsRes.data || [];`
- [ ] Remove creation/usage of `checkinMap`, `detailMap`, `roomGuestMap`, `folios`, `allCharges`, `processedCharges`.
- [ ] Remove manual matching logic (`find`, Map lookups, associatedDetail, checkin lookup, roomGuest lookup).
- [ ] Create `displayRows` directly via `rows.map(row => ({...}))` using `row.*` fields from the stored procedure.
- [ ] Keep UI unchanged (JSX/table columns/modal/checkout logic untouched).
- [ ] Keep TypeScript types as-is.
- [ ] Remove dead/unneeded helper functions that become unused after the refactor.
- [ ] Run `npm test` / `npm run build` (or `npm run lint` if available) to validate.

