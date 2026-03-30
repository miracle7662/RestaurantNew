# Auto-Print Implementation for BillPreviewPrint.tsx

## Plan Overview
Add auto-print functionality (same as KOT) to `src/views/apps/PrintReport/BillPrint.tsx`:
- Add `hasPrinted` state
- Add `autoPrint?: boolean` prop  
- Add 2x `useEffect` for auto-trigger + reset
- Add `if (autoPrint) return null;`
- Bonus: `onClose()` + `setTimeout(onHide)` in print success

## Steps to Complete
- [x] Step 1: Create/edit BillPrint.tsx with all changes
- [ ] Step 2: Test manual mode (`autoPrint={false}`) - button works
- [ ] Step 3: Test auto mode (`autoPrint={true}`) - prints without modal
- [x] Step 4: Update TODO.md (mark complete)
- [ ] Step 5: Attempt completion

**Current Progress: Core implementation complete. Ready for testing!**

