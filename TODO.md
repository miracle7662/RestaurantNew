# TODO: Fix Customer Clear on Table/Tab Change

## Current Progress
✅ **Step 0**: Plan approved by user

## Remaining Steps
- [ ] 1. Add prevTable tracking state/ref in Orders.tsx
- [ ] 2. Edit `handleTableClick()`: Clear customer post-refresh if new table
- [ ] 3. Edit `handleTabClick()`: Clear customer for new tabs unconditionally
- [ ] 4. Enhance `resetBillingPanel()`: Force customer clear
- [ ] 5. Edit KOT save success: Clear customer post-success
- [ ] 6. Test table switching → customer fields clear
- [ ] 7. Test tab switching (Pickup/Delivery) → customer fields clear
- [ ] 8. Verify existing order load still restores customer correctly
- [ ] 9. `attempt_completion`

