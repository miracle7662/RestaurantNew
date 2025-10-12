# TODO: Fix Pickup/Delivery "Make Payment" Opening Settlement Modal Without Prefill

## Overview
Update Orders.tsx to prefill the settlement modal with a default 'Cash' payment for the full order total when clicking "Make Payment" on pickup/delivery pending orders. This resolves the "total paid must match grand total" error by setting totalPaid = grandTotal and balance = 0 immediately.

## Steps

### Step 1: Update handlePendingMakePayment Function [x]
- Make the function async.
- Set `selectedOutletId` to `user?.outletid` to trigger payment modes fetch via useEffect.
- Set `isMixedPayment = false` for single payment.
- After setting states, add a short async delay (e.g., 100ms) to allow payment modes to load.
- Find 'Cash' in `outletPaymentModes`; if found, add to `selectedPaymentModes` and set `paymentAmounts['Cash'] = order.total.toFixed(2)`.
- Fallback: If no 'Cash', use the first available mode or show a toast error if none.
- Ensure `setShowSettlementModal(true)` and `setShowPendingOrdersView(false)` at the end.

### Step 2: Verify/Enhance Payment Modes Loading [x]
- Confirm the useEffect for fetching `outletPaymentModes` runs on `selectedOutletId` change.
- If needed, add a loading check or callback in handlePendingMakePayment to wait for modes (e.g., poll until modes.length > 0).

### Step 3: Minor Update to handleSettleAndPrint (If Needed) [x]
- Ensure `HotelID` is set from `user?.hotelid` in settlementsPayload (already present, but verify).
- After successful settlement, call `fetchPendingOrders(pendingType)` to refresh the pending list.

### Step 4: Testing and Validation [x]
- Run the app (`npm run dev`).
- Navigate to Pickup or Delivery tab, select an order, click "Make Payment".
- Verify: Modal opens with 'Cash' (or fallback) prefilled at full amount, no error message, "Settle & Print" enabled.
- Settle: Confirm success toast, order removed from pending list, UI resets.
- Edge cases: No payment modes available, non-'Cash' default, mixed payment toggle.
- Run linter (`npm run lint`) and check console for errors.

### Completion Criteria [x]
- All checkboxes marked [x].
- No regressions in dine-in settlement flow (manual prefill remains).
- Update this TODO.md after each step completion.
