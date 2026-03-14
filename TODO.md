# Fix 403 Error on Brand.tsx Manage Users Button (GET /api/users?brand_id=25)

## Status: [COMPLETED ✅]

### Step 1: [✅ DONE] Add authentication middleware to /api/users route
- File: `backend/server.js`
- Added `authenticateToken` middleware ✓

### Step 2: [✅ DONE] Update userController.getUsers logic
- File: `backend/controllers/userController.js`
- Uses `req.role_level`, `req.brand_id` from auth context ✓
- Handles `req.query.brand_id` as filter/override ✓

### Step 3: [PENDING] Restart backend server
**Run:** `cd backend && node server.js`

### Step 4: [PENDING] Test Manage Users button as superadmin

### Step 5: [PENDING] Test with brand_admin role (if applicable)

## Next Action:
1. Restart backend server
2. Login as superadmin
3. Click Manage Users button on Brand.tsx for brand_id=25
4. Verify users load without 403

## Backend Restart Command:
```
cd backend && node server.js
```


