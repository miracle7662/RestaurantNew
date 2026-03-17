# Focus Mode Implementation Plan - Orders.tsx

## Completed: 0/5

### 1. [ ] Create TODO.md (Current)
### 2. [ ] ✅ PLAN APPROVED BY USER
### 3. [ ] Update `handlePrintAndSaveKOT()` in Orders.tsx:
   - After `toast.success('KOT saved successfully!')`
   - Add: `if (!focusMode) { setShowOrderDetails(false); setTimeout(() => { if (tableSearchInputRef.current) { tableSearchInputRef.current.focus(); tableSearchInputRef.current.select(); } }, 150); }`
### 4. [ ] Update `handlePrintBill()` in Orders.tsx:
   - After successful bill print + `setBillActionState('printOrSettle')`
   - Add similar: `if (!focusMode) { setShowOrderDetails(false); setTimeout(() => { if (tableSearchInputRef.current) { tableSearchInputRef.current.focus(); tableSearchInputRef.current.select(); } }, 150); }`
### 5. [ ] Test & Complete
   - Toggle focusMode OFF → F9 KOT → Should go back to table list + focus input
   - Toggle focusMode ON → F9 → Should stay in details + focus table input there
   - Test F10 Bill print similarly
   - Update TODO.md as ✅
   - attempt_completion

**Current Status**: Plan approved. Ready for code edits.

