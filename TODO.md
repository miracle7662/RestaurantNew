# TODO: Make warehouseid, start_time, and end_time Required Fields

## Tasks
- [x] Update OutletData interface in src/common/api/outlet.ts to make warehouseid, start_time, and end_time required
- [x] Update Outlet.tsx to add required asterisks (*) to labels for warehouseid, start_time, and end_time
- [x] Add validation in handleModalSubmit in Outlet.tsx to check for these required fields
- [ ] Test form submission to ensure validation works
- [ ] Verify outlets are created/updated correctly with required fields
