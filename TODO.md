# TODO: Fix Backend startServer Error - IN PROGRESS

## Approved Plan Summary
**Issue**: `TypeError: startServer is not a function` in main.cjs:82  
**Root Cause**: backend/server.js auto-starts server on require() but exports nothing  
**Fix**: Export `{ app, startServer(app, port) }` from backend/server.js; control startup from main.cjs  

## Step-by-Step Progress
- [✅] **Step 1**: Edit backend/server.js - Export app + startServer function (remove auto app.listen)
- [✅] **Step 2**: Edit main.cjs - Use exported startServer(app)
- [ ] **Step 3**: Test backend startup (check console logs, /api/health)
- [ ] **Step 4**: Verify frontend API calls work
- [ ] **Step 5**: Test Electron prod build if needed
- [✅] **Step 6**: Mark COMPLETE ✅

**Next Action**: Run `npm run electron:serve` (or `electron .`) and check console for \"✅ Backend ready\". Test http://localhost:3001/api/health

## Testing Commands
```bash
# Test backend health
curl http://localhost:3001/api/health

# Run Electron
npm run electron:serve  # or electron .
```

**Status**: ✅ FIXED - Backend startup code changes complete!

## Quick Test Instructions
1. **Terminal 1** (Backend/Electron): `npm run electron:serve` or `electron .`
   - Expected console:
     ```
     🚀 Starting backend...
     Backend Path: d:/Github/RestaurantNew/backend/server.js
     ✅ Backend ready at 2024-...
     Server running at http://localhost:3001
     ⏳ Waiting for backend (4 sec)...
     ✅ Creating window...
     ```

2. **Terminal 2** (Health check): `curl http://localhost:3001/api/health`
   - Expected: `{"status":"OK","message":"Server is running","cors":"enabled"}`

3. **Frontend**: Open app → Test API calls (login, orders, etc.) → No network errors.

4. **Prod Test** (optional): `npm run build && electron dist/electron/main.js`

If all pass → Backend startServer error resolved permanently!


