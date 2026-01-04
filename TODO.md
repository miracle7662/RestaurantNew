# TODO: Implement Save KOT Transfer

## Backend Implementation
- [ ] Add transfer-kot route in TAxnTrnbillRoutes.js
- [ ] Implement transferKOT controller in TAxnTrnbillControllers.js
  - [ ] Handle item transfer logic
  - [ ] Update table statuses
  - [ ] Handle bill creation/merging

## Frontend Implementation
- [ ] Implement Save button in KotTransfer.tsx
  - [ ] Call transfer API
  - [ ] Handle success/error responses
  - [ ] Refresh Billview on success

## Testing
- [ ] Test table transfer mode
- [ ] Test KOT transfer mode
- [ ] Verify table status updates
- [ ] Verify Billview refresh
