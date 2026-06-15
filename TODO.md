# TODO - Bill (room_status_id=7) UI fix

- [ ] Update `normalizeRoomStatus` logic to treat `room_status_id=7` as highest priority => `Bill`.
- [x] Fix `getStatusBgColor/getStatusTextColor/getStatusBorderColor` to correctly style `Bill` using `color_bill` (red bg + appropriate text/border).

- [x] Ensure `enrichedRooms` uses the new normalization function that considers both `room_status_id` and `room_status`.

- [ ] Verify no regressions for other statuses.



