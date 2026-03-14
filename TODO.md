# RestaurantNew SpecialInst Fix Task

## Status: ✅ In Progress

**Current Step**: 1/2 - Create TODO.md ✅

## Steps to Complete:

### 1. **✅ Create TODO.md** (Completed)

### 2. **✅ Fix Frontend Payload** (Completed)
- File: `src/views/apps/Billview.tsx`
- **Change**: Renamed `specialInstructions` → `SpecialInst` in:
  - BillItem interface
  - saveKOT payload mapping: `SpecialInst: item.SpecialInst || null`
  - Table Form.Control: `value={item.SpecialInst}`, `handleItemChange(index, 'SpecialInst', ...)`
  - handleKeyPress calls

### 3. **✅ Verify Backend** (Completed)
- Backend already correct: `d.SpecialInst || null`

### 4. **🔬 Test & Complete** (Next)
```
1. Refresh Billview.tsx
2. Type "Test SpecialInst" in Special Instructions column
3. Press F9 (saveKOT)
4. Check backend console: SpecialInst: "Test SpecialInst" (NOT null)
5. attempt_completion
```

**Next Action**: Test changes → attempt_completion

