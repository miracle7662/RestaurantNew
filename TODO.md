# TODO: Fix XLSX Export Feature

✅ **Step 1: Install xlsx dependency in backend** ✅
- npm install xlsx@^0.18.5 [COMPLETED - installed in root, available via node_modules]

✅ **Step 2: Restart backend server** ⏳
- Kill existing server process and run `cd backend && node server.js` in new terminal
- (Previous attempts failed due to Windows cmd/PowerShell syntax; manual restart recommended)

⏳ **Step 3: Test export functionality**
- Access backend export endpoint (e.g., /api/menu/export?hotelid=1&outletid=1)
- Verify no "xlsx not found" warning in console/response

✅ **Step 4: Task completed** 
- XLSX package installed, export feature ready once server restarted.
