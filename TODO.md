# PrintAndSettle Fix in Billview.tsx - Implementation Plan

## Status: [✅] Not Started → In Progress

### TODO Steps (BlackboxAI Tracking):
- [✅] **Create TODO.md** with breakdown ✅
- [✅] **Step 1**: Update PrintAndSettle function ✅
- [✅] **Step 2**: Update BillPreviewPrint onPrint/onHide ✅
- [✅] **Step 3**: Update button disable logic ✅
- [ ] **Step 4**: Test Flow
- [ ] **Step 5**: Verify No Regressions
- [ ] **Finalize**: Update TODO.md to Completed + attempt_completion

**Next Action:** Test the Print&Settle flow (F12) → Verify settlement opens after print → Update progress ✅

### Step 1: Update PrintAndSettle function
- [ ] Add `setShowBillPrintModal(true)` after markBillAsBilled success
- [ ] Add flow state `const [printThenSettleFlow, setPrintThenSettleFlow] = useState(false)` *(already exists)*
- [ ] Set `setPrintThenSettleFlow(true)` in PrintAndSettle
- [ ] Remove direct `setShowSettlementModal(true)` *(already absent)*

### Step 2: Update BillPreviewPrint onPrint/onHide
- [ ] In BillPreviewPrint `onPrint`: if(printThenSettleFlow) → `setShowSettlementModal(true)`
- [ ] Reset `setPrintThenSettleFlow(false)` after settlement open *(already correct)*

### Step 3: Update button disable logic
- [ ] `disablePrintSettle = !hasOnlyExistingItems || hasNewItems` (block if unsaved new items)

### Step 4: Test Flow
- [ ] F12 → markBillAsBilled → BillPreviewPrint modal
- [ ] Print success → SettlementModal opens
- [ ] Settle → handleSettleAndPrint → success + navigate

### Step 5: Verify No Regressions
- [ ] Standalone Print (F10) still works
- [ ] Standalone Settle (F11) still works
- [ ] Other buttons/modals unchanged

**Next Action:** Implement Step 1 → Precise `edit_file` → Update progress ✅
