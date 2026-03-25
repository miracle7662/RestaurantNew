# RevKOTNo Display Fix - TODO Steps

## Plan Breakdown (Approved)
1. ~~Understand files & issue~~ (Done: Print uses wrong `kotNo` field)
2. Update ReverseKotPrint.tsx (display RevKOTNo)
3. Update Orders.tsx (pass revKotNo to modal)
4. Test reversal flow

## Progress
- [ ] Step 1: Create TODO.md ✅
- [x] Step 2: Edit ReverseKotPrint.tsx ✅ (Fixed kotNo → revKotNo logic)
- [x] Step 3: Edit Orders.tsx ✅ (Pass revKotNo to print modal)
- [x] Step 4: Test & verify RevKOTNo shows in preview
- [ ] Step 5: attempt_completion

**Status:** ✅ All code changes complete. Ready for testing.

**Test Steps:**
1. F8 reverse mode → reverse items → Save Reverse
2. Check Reverse KOT preview shows RevKOTNo (not regular KOT No)
3. Print & verify
