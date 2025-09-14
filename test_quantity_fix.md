# Quantity Fix Test Plan

## Issues Fixed

### 1. Backend Query Grouping Issue ✅
**Problem**: The `getUnbilledItemsByTable` query was grouping by `RuntimeRate`, causing the same item with different rates to appear as separate rows, leading to quantity multiplication.

**Fix**: 
- Removed `RuntimeRate` from GROUP BY clause
- Used `AVG(d.RuntimeRate)` to get average rate
- Added `SUM(d.RevQty) as RevQty` to properly return reverse quantities

### 2. RevQty Field Missing ✅
**Problem**: The `RevQty` field was not being returned in the unbilled items query.

**Fix**: Added `SUM(d.RevQty) as RevQty` to both `getUnbilledItemsByTable` and `getUnbilledItemsByKOTNo` queries.

### 3. Frontend RevQty Handling ✅
**Problem**: Frontend was not handling the `RevQty` field from the backend.

**Fix**: 
- Added `revQty` field to `MenuItem` interface
- Updated both `fetchUnbilledItems` and `fetchUnbilledItemsByKOTNo` functions to include `revQty`

## Test Scenarios

### Scenario 1: Normal KOT Creation
1. Add items to a table
2. Click "Print & Save KOT"
3. Click the same table again
4. **Expected**: Should show the same quantities as before, not multiplied

### Scenario 2: Quantity Reduction
1. Add items to a table (e.g., 3 units of Item A)
2. Reduce quantity using minus button (e.g., reduce to 2 units)
3. Click "Print & Save KOT"
4. Click the same table again
5. **Expected**: Should show 2 units, not 3 or 5

### Scenario 3: Re-KOT Creation
1. Add items to a table
2. Click "Print & Save KOT"
3. Use Re-KOT to reduce quantity
4. Click the same table again
5. **Expected**: Should show net quantity (original - reversed)

## Backend Changes Made

### File: `backend/controllers/TAxnTrnbillControllers.js`

#### Function: `getUnbilledItemsByTable` (lines 620-640)
```sql
-- OLD QUERY (causing multiplication)
GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate, b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose, b.TableID

-- NEW QUERY (fixed)
GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose, b.TableID
```

#### Function: `getUnbilledItemsByKOTNo` (lines 660-677)
```sql
-- OLD QUERY (causing multiplication)
GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), d.RuntimeRate, b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose

-- NEW QUERY (fixed)
GROUP BY d.ItemID, COALESCE(m.item_name, 'Unknown Item'), b.isBilled, d.isNCKOT, b.NCName, b.NCPurpose
```

## Frontend Changes Made

### File: `src/views/apps/Transaction/Orders.tsx`

#### Interface: `MenuItem` (lines 11-26)
```typescript
interface MenuItem {
  // ... existing fields
  revQty?: number; // Added RevQty field
  // ... rest of fields
}
```

#### Function: `fetchUnbilledItems` (lines 584-597)
```typescript
const formattedItems = response.data.map((item: any) => ({
  // ... existing fields
  revQty: Number(item.RevQty) || 0, // Added RevQty mapping
  // ... rest of fields
}));
```

#### Function: `fetchUnbilledItemsByKOTNo` (lines 620-633)
```typescript
const formattedItems = response.data.map((item: any) => ({
  // ... existing fields
  revQty: Number(item.RevQty) || 0, // Added RevQty mapping
  // ... rest of fields
}));
```

## Expected Results

1. **No More Quantity Multiplication**: When clicking a table after "Print & Save KOT", quantities should remain the same, not multiply.

2. **Correct Quantity Display**: Reduced quantities should be properly saved and displayed.

3. **RevQty Field Available**: The `revQty` field should now be properly returned and available in the frontend.

4. **Proper Net Quantity Calculation**: The system should correctly calculate net quantities by summing KOT and Re-KOT quantities.

## Testing Instructions

1. Start the backend server
2. Start the frontend application
3. Test the scenarios mentioned above
4. Verify that quantities are not multiplied when clicking tables
5. Verify that reduced quantities are properly saved and displayed
6. Check that RevQty field is available in the frontend data
