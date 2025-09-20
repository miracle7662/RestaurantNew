# F8 Key Press Implementation

## Plan Implementation Steps:

### Backend Implementation
- [ ] Add F8 endpoint in TAxnTrnbillControllers.js
  - [ ] Create handleF8KeyPress function
  - [ ] Integrate with outletSettingsRoutes to get ReverseQtyMode
  - [ ] Implement reverse quantity logic
  - [ ] Update RevQty field in database

### Frontend Implementation
- [ ] Add F8 key handler in OrderDetails.tsx
  - [ ] Add global F8 keydown event listener
  - [ ] Show authentication modal
  - [ ] Call F8 backend endpoint
  - [ ] Update items display

### Integration
- [ ] Update Orders.tsx for F8 state handling
  - [ ] Add F8 state management
  - [ ] Handle F8 operation results
  - [ ] Update UI after F8 operations

### Testing
- [ ] Test F8 functionality with ReverseQtyMode enabled
- [ ] Test F8 functionality with ReverseQtyMode disabled
- [ ] Test authentication modal integration
- [ ] Test error handling scenarios
