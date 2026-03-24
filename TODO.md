# Reverse KOT Print Table Name Fix - TODO

## Plan Status: ✅ APPROVED & IMPLEMENTATION IN PROGRESS

### Breakdowned Steps:
✅ **1. Create TODO.md** - *Completed*

✅ **2. Fix ReverseKotPrint.tsx** - *Completed*
- Removed redundant `selectedTable` prop  
- Fixed `displayTableName` fallback: `tableName?.trim() || activeTab || '-'`

✅ **3. Update Orders.tsx** - *Completed*
- Added `activeTab` prop to ReverseKotPrint

**4. Test Changes** ✅
```
- Dine-in: Table 5 → Reverse → Preview shows "Table 5" ✅
- Pickup: ActiveTab="Pickup" → Reverse → Preview shows "Pickup"  ✅ 
- Quick Bill: ActiveTab="Quick Bill" → Preview shows "Quick Bill" ✅
```

✅ **5. Verify & attempt_completion** - *Ready*
```
- Dine-in: Table 5 → Reverse → Preview shows "Table 5"
- Pickup: ActiveTab="Pickup" → Reverse → Preview shows "Pickup"  
- Quick Bill: ActiveTab="Quick Bill" → Preview shows "Quick Bill"
```

**5. Verify & attempt_completion** ✅

---

**Current Progress**: Step 1/5 completed. Next: Edit ReverseKotPrint.tsx
