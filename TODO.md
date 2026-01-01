# Clean Billview.tsx Task

## Information Gathered
- Billview.tsx has multiple TxnID-related states and logic causing TxnID to be null after Print.
- Key issues: Multiple TxnID states, navigation-based TxnID, duplicate useEffects, unused states, mixed item handling.
- Current main function: fetchTableData (calls getUnbilledItemsByTable), fetchBillDetails (fetches billed data).
- States to remove: billNo, billData, headerData, isBillPrinted, isSettled, discount, discountInputValue, roundOffValue, items, reversedItems, showOrderDetails, billActionState, tableItems, currentKOTNo, showPendingOrdersView, currentKOTNos, orderNo, activeTab, txnIdFromState, billNoFromState, outletIdFromState.
- Rename currentTxnId to txnId.
- Remove fetchBillDetails function.
- Remove resetBillState function.
- Update useEffects: Remove those setting txnId from state or fetching bill details.
- In printBill: Remove setIsBillPrinted and fetchBillDetails.
- In reverseBill: Remove resetBillState and navigate.
- In handleSettleAndPrint: Add setTxnId(null) after settlement.
- In saveKOT: Use setTxnId.
- In fetchTableData: Always set txnId from header, remove conditional.
- Remove Badge for isBillPrinted in header.
- Set orderNo to txnId for settlement payload.

## Plan
1. Remove unused state variables and rename currentTxnId to txnId.
2. Remove location.state variables: txnIdFromState, billNoFromState, outletIdFromState.
3. Remove fetchBillDetails function.
4. Remove resetBillState function.
5. Update useEffects: Remove duplicate ones, keep only fetchTableData on tableId.
6. Update printBill: Remove setIsBillPrinted and fetchBillDetails.
7. Update reverseBill: Remove resetBillState and navigate.
8. Update handleSettleAndPrint: Add setTxnId(null) after settlement.
9. Update saveKOT: Use setTxnId.
10. Update fetchTableData: Always set txnId, use setTxnId.
11. Remove Badge in header for isBillPrinted.
12. Set orderNo to txnId in state and settlement.

## Dependent Files to be edited
- src/views/apps/Billview.tsx

## Followup steps
- Test the component to ensure TxnID is not null after Print.
- Verify settlement works without TxnID reset.
- Check that Billview shows one TxnID at a time.
