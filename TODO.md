# Fix Outlet Settings 404 Error - TODO

## Completed: ✅
- [x] Analyzed error & identified root cause (missing DB records for outlet 7)
- [x] Created comprehensive fix plan 
- [x] User confirmed to proceed 
- [x] Created TODO.md for tracking

## Pending: ⏳
🔥 **CRITICAL**: Run SQL fix first!
```
cd backend && mysql -u root -p restaurant_db < fix_outlet_7_settings.sql
```
(Enter **twice** for empty password)

1. **✅ Verify**: `curl http://localhost:3001/api/outlets/settings/7`
2. **Restart**: Backend + Frontend  
3. **Test**: Modify Outlet Configuration button

*Status: AWAITING SQL EXECUTION*

*Updated: $(date)*


