# Billview.tsx Department-wise Variant Fix - TODO

**Status: Step 1/4 ✅ Added deptFilteredMenuItems state + useEffect for dept change detection/clearing.**

## Completed (6/10) ✅
- [x] 1. Create TODO.md ✅
- [x] 2. Read/analyze Billview.tsx deeply ✅
- [x] 3. Backup original Billview.tsx ✅
- [x] 4. Read Tableview.tsx ✅
- [x] 5. Read MenuService ✅
- [x] 6. Add dept-filtered menuItems useEffect ✅
- [x] 7. Add billItems clear on dept change ✅
- [ ] 8. Filter displayedItems by dept
- [ ] 9. Strengthen datalist filters  
- [ ] 10. Test & attempt_completion

## Changes Made:
```
✅ Added: deptFilteredMenuItems state
✅ Added: prevDepartmentIdRef  
✅ NEW useEffect: Filters menuItems → deptFilteredMenuItems (only current dept variants, rate > 0)
✅ NEW useEffect: Clears billItems when dept changes (prevents cross-dept leakage)
✅ Preserved: Original menu fetch unchanged
```

**Next**: Update handleItemChange, displayedItems useMemo, datalists to use `deptFilteredMenuItems`




