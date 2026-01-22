# TODO: Add Enable Print Toggle to KOT and Bill Printer Settings

## Database Changes
- [ ] Add `enable_print BOOLEAN DEFAULT 1` to kot_printer_settings table in db.js
- [ ] Add `enable_print BOOLEAN DEFAULT 1` to bill_printer_settings table in db.js

## Backend Controller Updates
- [ ] Update settingsController.js to handle enable_print in createKotPrinterSetting
- [ ] Update settingsController.js to handle enable_print in createBillPrinterSetting
- [ ] Add update methods for KOT and Bill printer settings if needed

## Frontend Interface Updates
- [ ] Update KotPrinterSetting interface in Settings.tsx to include enable_print
- [ ] Update BillPrinterSetting interface in Settings.tsx to include enable_print

## Frontend Form Updates
- [ ] Add toggle switch for enable_print in KOT Printer Settings form
- [ ] Add toggle switch for enable_print in Bill Printer Settings form
- [ ] Update form handlers to include enable_print in API calls

## API Integration
- [ ] Update handleAddKotPrinter to send enable_print
- [ ] Update handleAddBillPrinter to send enable_print
- [ ] Update handleEditKotPrinter to handle enable_print
- [ ] Update handleEditBillPrinter to handle enable_print

## Testing
- [ ] Test toggle functionality
- [ ] Verify backend persistence
