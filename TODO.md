# Fix Outlet Settings 404 & Update Issues

## Current Status
- [x] Analyzed error: 404 on /api/outlets/settings/7 due to missing `await` in controller
- [x] Confirmed routes correct
- [x] Confirmed DB mysql2 promise
- [ ] Fix controller bugs
- [ ] Test endpoint
- [ ] Check data for outlet 7
- [ ] Frontend verification if needed

## Steps
1. [ ] Fix getOutletBillingSettings: add await db.query
2. [ ] Standardize other get*Settings methods (remove SQLite .prepare().get())
3. [ ] Test: curl http://localhost:3001/api/outlets/settings/7
4. [ ] Check fix_outlet_7_settings.sql if data missing
5. [ ] Verify updates work (updateOutletSettings)
6. [ ] Frontend AddOutlet.tsx if issues persist

Progress: Starting controller fixes...
