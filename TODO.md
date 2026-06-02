# TODO

- [ ] Update `src/views/apps/Masters/RestaurantMasters/TableManagement.tsx`
  - [ ] In Add flow (tableItem == null) after successful save: clear only `table_name` (keep hotel/outlet/department/status selections)
  - [ ] In modal close (Cancel/X) clear all modal fields for next open
  - [ ] Ensure edit flow behavior remains: on successful update, close modal and reset via existing `onHide`
  - [ ] Quick manual test checklist: add -> save -> new row appears; close -> reopen -> fields cleared

