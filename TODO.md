# Edit Settlement Page Implementation TODO

## Frontend Updates
- [x] Update edit modal to fetch payment modes dynamically from /api/payment-modes
- [ ] Add client-side validation for amount matching bill total
- [ ] Add success/error notifications on save/delete operations
- [ ] Highlight rows for edited/reversed settlements (e.g., different colors)
- [ ] Ensure pagination controls are properly implemented

## Backend Verification
- [ ] Verify updateSettlement endpoint correctly validates amount against bill total
- [ ] Verify deleteSettlement endpoint properly logs and soft deletes
- [ ] Check if TrnSettlementLog table is created (run SQL if needed)
- [ ] Test API endpoints for correctness

## Testing
- [ ] Test search and filter functionality
- [ ] Test edit settlement flow with validation
- [ ] Test delete/reverse settlement flow
- [ ] Verify audit logs are created correctly
- [ ] End-to-end testing of the full page
