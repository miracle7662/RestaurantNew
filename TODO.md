# Fix React "Cannot read properties of undefined (reading 'map')" Error
## Status: 🔄 In Progress

### Plan Implementation Checklist:

- [ ] **✅ STEP 1**: Create this TODO.md ✓
- [✅] **STEP 2**: Fix `src/views/apps/PrintReport/DuplicateBillPrint.tsx` ✓
- [✅] **STEP 3**: Fix `src/views/apps/PrintReport/BillPrint.tsx` (identical changes) ✓
  - Add `items?: MenuItem[] | null` to interface
  - Safe map: `items?.map(...) ?? []`
  - Safe filter/reduce: `(items ?? [])`
  - Update useMemo deps
- [ ] **STEP 3**: Fix `src/views/apps/PrintReport/BillPrint.tsx` (identical changes)
- [ ] **STEP 4**: Update `src/views/apps/Billview.tsx` 
  - Modal props: `items={billItems.filter(...) || []}`
- [ ] **STEP 5**: Test bill preview modals + async loading
- [ ] **✅ COMPLETE**: Remove TODO.md + attempt_completion ✓

**Current File**: DuplicateBillPrint.tsx (VSCode visible)
**Next Action**: Apply null-safety fixes

**Acceptance Criteria**:
- No more `.map()` crashes
- Empty bill shows correctly
- Print works after data loads

