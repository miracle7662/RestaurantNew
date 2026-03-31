## BillPrint Customer Display Fix - Task Progress

### Approved Plan:
1. **✅ Create TODO.md** - Track progress (Current step)
2. **Add comprehensive debug logging** to BillPrint.tsx:
   - Raw API response from bill print settings
   - `applyBillSettings` input/output 
   - Exact condition values: `localFormData.show_customer_bill`, `customerName`, `mobileNumber`
3. **Test bill print** → Check browser console for logs
4. **Fix boolean conversion** in `applyBillSettings` if needed
5. **Verify settings flow**: AddOutlet.tsx → DB → BillPrint.tsx
6. **Add fallback display** for debugging
7. **Clean up debug logs** after fix
8. **attempt_completion** ✅

### Current Status: 
- ✅ Step 1: TODO.md created
- ✅ Step 2: Debug logs added to BillPrint.tsx (RAW API + applyBillSettings + Customer condition)
- **Next**: Step 3 - Test bill print → Open BillPrint modal → Check browser console (F12 → Console tab) → Share debug output

**Instructions**: Test bill print after each step and share console output.
