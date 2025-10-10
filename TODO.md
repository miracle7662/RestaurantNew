# Settlement Modal Payment Modes Update

## Steps from Approved Plan

1. **Update handlePaymentModeClick**: Modify to ensure single mode selects only one and auto-fills grandTotal (read-only via JSX). In mixed mode, when selecting a new mode, auto-fill with current remaining balance (grandTotal - current totalPaid). Deselection clears amount.

2. **Verify/Ensure readOnly in JSX**: Confirm Form.Control in settlement modal has readOnly={!isMixedPayment} for single mode inputs.

3. **No changes needed for handlePaymentAmountChange**: It already updates amounts; auto-fill for new modes uses updated totalPaid on selection.

## Follow-up Steps
- [ ] Implement changes in src/views/apps/Transaction/Orders.tsx.
- [ ] Test single mode: Select one payment mode, verify auto-fill with grandTotal and read-only input.
- [ ] Test mixed mode: Toggle on, select first mode (auto-fill grandTotal, editable), edit amount, select second (auto-fill remaining), verify balance updates.
- [ ] Test settlement: Ensure handleSettleAndPrint works with updated logic, balance === 0.
- [ ] Update TODO.md with completion marks after verification.
