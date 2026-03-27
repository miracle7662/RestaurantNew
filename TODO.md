# F8 All KOTs Reversal → Table Status 0 Fix (Orders.tsx & Billview.tsx)

## Steps:
- [x] Step 1: Create TODO.md ✅ **DONE**
- [x] Step 2: Edit Orders.tsx ✅ **DONE** - Fixed `handleSaveReverse()`: `allReversed` → `totalRemainingQty <=0` check (post-backend refresh), added 🔧 DEBUG logging/toast, forced `fetchTableManagement()` after status=0
- [x] Step 2.5: Edit Billview.tsx ✅ **DONE** - Added same logic to `handleReverseKotSave()`: `totalRemainingQty <=0` check on `billItems`, `console.log('🔧 F8 Reversal DEBUG (Billview)')`, status=0 on full reversal, toasts, `fetchTableManagement()`
- [ ] Step 3: Test F8 reversal flow in **both Orders.tsx & Billview.tsx** → verify table status updates to 0 (vacant/green)
- [ ] Step 4: attempt_completion

**Status:** Orders.tsx ✅. Billview.tsx pending similar fix per user feedback. Ready for Step 2.5.
