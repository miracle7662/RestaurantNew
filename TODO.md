# TODO: Show TxnDatetime in billDate field (Approved Plan)
Status: ✅ **IN PROGRESS**

## Breakdown of Approved Plan (Step-by-step)

### Step 1: [PENDING] ✅ Read BillPreviewPrint.tsx
- Use `read_file` on `src/views/apps/PrintReport/BillPreviewPrint.tsx`
- Analyze where `billDate`/`date` is displayed in print preview
- Identify exact location to replace with `TxnDatetime` (full timestamp)

### Step 2: [PENDING] Edit BillPreviewPrint.tsx
- Replace date display logic to use `props.txnDatetime` (full timestamp)
- Format `TxnDatetime` nicely (e.g., DD/MM/YYYY HH:MM)
- Preserve styling/print layout

### Step 3: [PENDING] Edit DuplicateBillPrint.tsx  
- Explicitly map `billData.txnDatetime = data.TxnDatetime` from backend
- Pass `txnDatetime` prop to `BillPreviewPrint`

### Step 4: [PENDING] Test Changes
- Restart dev server if needed: `npm run dev`
- Navigate to Duplicate Bill Print
- Search bill by `billNo` + `billDate`
- Verify **full TxnDatetime** (with time) shows in print preview
- Test print preview looks correct

### Step 5: [PENDING] Complete
- Update this TODO.md with ✅ marks
- Run `attempt_completion`

**Next Action**: Read `BillPreviewPrint.tsx` to understand display logic.

