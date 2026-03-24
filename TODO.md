# KOT Print Debug - Item Name/Qty Showing Issue

## Status: 🔍 Debugging (0/6 complete)

### Step 1: Add Console Logging [PENDING]
```
Billview.tsx saveKOT():
console.log("🔍 billItems before filter:", billItems);
console.log("🔍 printItems (new only):", printItems);
console.log("🔍 currentKotNoForPrint:", currentKotNoForPrint);
```
**Test**: Add 3 items → F9 → check console → copy output

### Step 2: Verify Backend mkotNo Update [PENDING]
```
After saveKOT API: loadBillForTable() → check if items.mkotNo updated
Expected: After 1st F9, items should have mkotNo = "123|124"
2nd F9: printItems should be EMPTY
```

### Step 3: Test Duplicate Print [PENDING]
```
1. Add items → F9 (print 1st KOT)
2. F9 again → should show EMPTY preview / no print
3. Result?
```

### Step 4: Check KotPrint.tsx Preview [PENDING]
```
F9 modal opens → screenshot preview
Does it show correct new items only?
```

### Step 5: Backend API Debug [PENDING]
```
Check backend /orders/kot response:
Does it return correct KOTNo?
Does it update items.mkotNo in DB?
```

### Step 6: Verify Electron Print [PENDING]
```
Preview correct? → Printer output matches preview?
```

## Expected Behavior ✅
```
KOT Print = ONLY new items (!item.mkotNo)
Item name + qty = REQUIRED (kitchen needs to know what to cook!)
