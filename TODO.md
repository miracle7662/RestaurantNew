# TODO: Implement handlePrintAndSettle Sequential Flow
## Plan Breakdown
1. [ ] Add new state `showSettlementAfterPrint`
2. [ ] Add useEffect to watch bill print modal close → open settlement
3. [ ] Update `handlePrintAndSettle` to call `handlePrintBill` + set bridge state
4. [ ] Update `handlePrintBill` success → set bridge state true
5. [ ] Test F11 flow: Print modal → Settlement modal → Settle success
6. [ ] attempt_completion

**Status**: Starting edits...

