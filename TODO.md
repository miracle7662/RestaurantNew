# TODO: Extend Table Status Logic

## Tasks
- [ ] Update Orders.tsx to display table background color based on status (0: default, 1: green, 2: red)
- [ ] Add updateTableStatus function in Orders.tsx to call TableManagement API
- [ ] Update handlePrintAndSaveKOT to set table status to 1 after KOT save
- [ ] Update handlePrintBill to set table status to 2 after bill print
- [ ] Refresh table list after status updates

## Dependent Files
- src/views/apps/Transaction/Orders.tsx

## Followup Steps
- Test KOT save updates status to 1 (green)
- Test bill print updates status to 2 (red)
- Verify UI colors update dynamically
