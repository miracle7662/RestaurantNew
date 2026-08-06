# TODO — Room Add Modal Reset Behavior

## Steps
- [x] Read relevant files (index.tsx, RoomForm.tsx, FormModal.tsx, roomController.js)
- [x] Confirm plan with user
- [x] Modify `handleSubmit` in `src/views/pages/hotel-master/Room/index.tsx` to:
  - Track save success
  - After successful Add (create), clear only text fields (room_no, room_name, display_name, room_ext_no) while keeping dropdowns (room_category_id, department_id, block_id, floor_id, room_status_id)
  - Leave modal open
  - In Edit mode, clear nothing
