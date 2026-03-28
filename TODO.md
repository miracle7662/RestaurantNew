# Duplicate Bill Print Fix: Restaurant Name Issue

## Plan Status: ✅ APPROVED

**Issue**: DuplicateBillPrint.tsx shows outlet name twice instead of restaurant name
**Root Cause**: Backend `/reports/duplicate-bill` sends `outlet_name` for BOTH restaurantName & outletName

## Steps (In Order)

### ✅ Step 1: Create TODO.md [COMPLETE]
- File created with exact plan

### ✅ Step 2: Edit backend/controllers/Reportcontroller.js (PRIMARY FIX) [COMPLETE]
**Changes:**
1. ✓ Query: Added `mo.brand_name AS restaurantName` 
2. ✓ Response: `restaurantName: bill.restaurantName || bill.outlet_name || 'Restaurant'`

### ✅ Step 3: Minor edit src/views/apps/PrintReport/DuplicateBillPrint.tsx [COMPLETE]
**Safety net:** `restaurantName={billData.restaurantName || user?.hotel_name || billData.outletName}`

### ⏳ Step 4: Test Changes
**Safety net:** Improve fallback → `billData.restaurantName || user?.hotel_name || billData.outletName`

### ⏳ Step 4: Test Changes
```
1. Save files
2. Backend: cd backend && npm start (restart server)
3. Frontend: npm run dev (if needed)
4. Test: Duplicate Bill Print → Load bill → Verify restaurant name shows separately from outlet
5. Print preview → Both names distinct
```

### ⏳ Step 5: Update TODO.md & Complete [After Step 4]
- Mark steps ✅
- attempt_completion

## Current Progress: 3/5 COMPLETE
✅ Steps 1-3 done (TODO.md, backend controller, frontend safety net)

### ⏳ Step 4: Test Changes
```
1. Backend restart: cd backend && npm start
2. Frontend: npm run dev
3. Test Duplicate Bill Print → restaurant name now shows correctly (separate from outlet)
4. Print preview confirms fix
```


