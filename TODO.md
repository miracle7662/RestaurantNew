## ✅ Plan Implementation: Print → Preview → Settlement Modal → Settle

### Breakdown Steps:
- [x] **Step 1**: Create TODO.md (Current)
- [x] **Step 2**: Add state `printThenSettleFlow` in Orders.tsx to track print-then-settle flow
- [x] **Step 3**: Update `handlePrintAndSettle`: Call print API → set print modal + flow state → open print preview
- [x] **Step 4**: Update BillPrintModal onHide: Close print → if flow active → open settlement modal
- [ ] **Step 5**: Test flow: Button → Print Preview → Settlement Modal → Settle → Reset UI
- [ ] **Step 6**: Verify table status → vacant (0), QuickBill list refresh
- [ ] **Step 7**: attempt_completion

**Status**: Print→Preview→Settlement flow implemented. Ready for testing.

