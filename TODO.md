# TODO: Update Outlet Controller for New Fields

## Tasks
- [x] Update addOutlet function: Add destructuring for new fields (logout_pos, password_protection, send_payment_link, send_ebill_whatsapp, add_custom_qr, start_time, end_time, warehouse_id, reduce_inventory)
- [x] Update addOutlet function: Modify INSERT statement to include new fields with proper conversion for switches
- [x] Update addOutlet function: Update response object to include new fields
- [x] Update updateOutlet function: Add destructuring for new fields
- [x] Update updateOutlet function: Modify UPDATE statement to include new fields with proper conversion for switches
- [x] Update updateOutlet function: Update response object to include new fields
- [ ] Test the changes to ensure switches are stored as 1/0 and dropdowns as exact values
