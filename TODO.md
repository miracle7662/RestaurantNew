# Task: Add table name display to ReverseKotPrint.tsx (similar to KotPrint.tsx)

## Plan Breakdown
✅ [x] Step 1: Create TODO.md with implementation steps  
✅ [x] Step 2: Update ReverseKotPrint.tsx interface - add `selectedTable?: string | null;` prop  
✅ [x] Step 3: Update generateContent useMemo - add `selectedTable` to deps  
✅ [x] Step 4: Add table name big box HTML to generateContent (after outlet name)  
✅ [x] Step 5: Test preview/print rendering  
✅ [x] Step 6: Mark complete and attempt_completion  

**Current Status:** ✅ COMPLETE - Reverse KOT now shows table name prominently in big box format matching KotPrint.tsx. Pass `selectedTable={selectedTable}` when calling component.

