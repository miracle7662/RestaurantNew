# GST No Display Fix - Task Progress

## Plan Summary
- Fix GST No display logic in BillPrint.tsx: Show only if `localFormData.trn_gstno` (setting) is true OR in preview mode (`showAll`).
- Remove fallback `!!user?.trn_gstno` that bypasses setting.

## Steps
- [x] 1. Create TODO.md ✅
- [ ] 2. Edit BillPrint.tsx condition
- [ ] 3. Test with setting ON/OFF
- [ ] 4. Complete task

**Status**: Ready for code edit.

