# TODO List for Settlement Integration

## Backend
- [x] Verify settle endpoint in TAxnTrnbillControllers.js (already exists)
- [x] Verify settlement insertion into TrnSettlement table (already implemented)

## Frontend - Settlement.tsx
- [ ] Fix table columns to match headers: remove extra HotelID td
- [ ] Add live update mechanism (polling every 10 seconds)

## Frontend - Orders.tsx
- [ ] Verify settlement modal sends correct data to backend (already implemented)
- [ ] Ensure settlement details include all required fields

## Testing
- [ ] Test end-to-end settlement flow
- [ ] Verify Settlement.tsx updates after settlement
