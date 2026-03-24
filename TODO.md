# KOT Print Modal Fix - Progress Tracker

## Plan Status: ✅ APPROVED BY USER

**Problem**: F9 navigates directly to Tableview (missing preview modal)

**Root Cause**: Premature navigation in `saveKOT()` before modal state

## TODO Steps (1/5 Complete):

- [x] **Step 1**: Create TODO.md ✅ **DONE**
- [ ] **Step 2**: Fix `saveKOT()` navigation logic in Billview.tsx
  - Remove premature `navigate()` calls when `print=true`
  - Reliable KOT# extraction: `res.data?.KOTNo ?? editableKot`
  - Add loading state during save→modal transition
- [ ] **Step 3**: Test F9 flow 
  - Add items → F9 → Verify Save+Modal → Print → Tableview
- [ ] **Step 4**: Verify other flows (F10, F12) still work
- [ ] **Step 5**: attempt_completion

**Next Action**: Step 2 - Edit Billview.tsx

