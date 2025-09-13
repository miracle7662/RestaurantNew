# TODO: Implement Table Reset Functionality

## Backend Changes
- [x] Add resetTableStatus function in TableManagementController.js to set table status to 0 (vacant)
- [x] Add reset route in TableManagementRoutes.js

## Frontend Changes
- [ ] Add reset button in Orders.tsx for each table
- [ ] Add resetTable function in Orders.tsx to call backend API and update local state
- [ ] Update getTableButtonClass to handle status 0 (vacant) properly
- [ ] Add reset functionality to table management UI

## Testing
- [ ] Test KOT save sets status to 1 (occupied)
- [ ] Test bill print sets status to 2 (billed)
- [ ] Test reset button sets status to 0 (vacant)
- [ ] Verify UI color changes correctly for all statuses
