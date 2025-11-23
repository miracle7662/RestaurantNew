# TODO for Fixing KOT Printer Settings API Issue

- [ ] backend/controllers/settingsController.js: Add getAllKotPrinterSettings method
- [ ] backend/routes/settingsRoutes.js: Add GET /kot-printer-settings route without :id
- [ ] src/views/apps/Settings.tsx: Update API_BASE to use port 3001 instead of 5000
- [ ] Restart backend server
- [ ] Rebuild/restart frontend
- [ ] Test API calls on Settings page, verify no errors
