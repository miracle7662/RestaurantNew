# Settelment.tsx Backdate & F8 Print Enhancements

## Status: 📋 Planned (0/8 completed)

### 1. [ ] Create TODO.md (Current step - done after this)
### 2. ✅ Add imports for F8PasswordModal in Settelment.tsx
### 3. ✅ Add states: isBackDate, showF8Modal, printPendingGroup, f8Error, f8Loading
### 4. ✅ Implement backdate logic: compare filters.from/to < currDate → disable Edit
### 5. ✅ Add useEffect to watch dates/currDate for isBackDate
### 6. ✅ Modify Print button: set printPendingGroup → show F8 modal
### 7. ✅ Implement handlePrintAuth(password): verify (TODO: API/hardcode) → handlePrintDuplicateBill
### 8. ✅ Add F8PasswordModal JSX + backdate warning UI
### 9. [ ] Test & attempt_completion

**Notes:**
- Backend API for F8 auth needed? (pending confirmation)
- Edit: global disable on form backdate
- Print: F8 modal → preview on submit

