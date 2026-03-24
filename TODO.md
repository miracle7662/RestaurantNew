# KOT Print Preview Items Fix - Progress Tracker

## Plan Overview
Fix: Items not showing in `billview.tsx` KOT print preview (`KotPrint.tsx` modal).
Root Cause: `printItems` filters only new items (`!mkotNo`), fallback uses `isNew: false` for fetched items → empty preview on subsequent KOTs.

**Approved Solution**: Pass/filter **all valid items** (`itemId > 0`) to preview.

## TODO Steps (1/5 Complete)

### ✅ 1. Create/Update TODO.md [COMPLETE]
- ✓ Created with steps.

### ☐ 2. Update Billview.tsx
- Path: `src/views/apps/Billview.tsx`
- Change `<KotPreviewPrint />` `printItems` to `billItems.filter(item => item.itemId > 0)` (all items).
- Clear `items={[]}` fallback.
- ✅ Test: F9 → Preview shows all items.

### ☐ 3. Update KotPrint.tsx
- Path: `src/views/apps/PrintReport/KotPrint.tsx`
- Fix `kotItems`: `printItems.length > 0 ? printItems : items.filter(i => i.itemId > 0)`.
- Add console.log('kotItems.length:', kotItems.length).
- ✅ Test: Preview renders items → Print works.

### ☐ 4. Test Full Flow
```
1. Add 2-3 items → F9 (1st KOT) → Preview shows items ✓ Print ✓
2. Add 1 more item → F9 (2nd KOT) → Preview shows ALL items ✓ Print ✓
3. Edge: Empty → F9 → Toast 'No new items', no empty preview.
4. Settings: Toggle KOT settings → Preview respects flags.
```
- Browser: Open Billview → Test F9 multiple times.

### ☐ 5. Complete & Verify
- Run `npm run dev`.
- No errors, linter clean.
- Update TODO.md: Mark ✅ all steps.
- `attempt_completion`: "Fixed KOT preview - now shows all valid items."

## Next Action
Proceed to **Step 2: Edit Billview.tsx**?

**Current Progress: 3/5** (Billview + KotPrint updated)
