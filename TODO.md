# Implementation Plan for Secure Reverse Quantity on Billed Orders

## Overview
Fully implement reverse quantity functionality for billed orders in Orders.tsx and related components. This includes F8 password authentication, updating net quantities, tracking reversals, and printing Re-KOT. Ensure unbilled flow remains unchanged. Test integration with backend APIs.

## Steps

### 1. Update handleF8PasswordSubmit in Orders.tsx
- After successful F8 auth on billed tables:
  - Call refreshItemsForTable(tableIdNum) to fetch latest net qty from backend.
  - Set reverseQtyMode = true.
  - Set isGroupedView = false (expanded view).
  - Initialize reverseQtyItems from current items (copy for potential reversals).
  - Show success toast.
- Ensure auth only for billed (items.some(item => item.isBilled === 1)).
- Add error handling for refresh.

Status: [ ] Not started

### 2. Modify handleReverseQty in Orders.tsx
- Add check: If item.isBilled === 1 (billed), ensure reverseQtyMode is true.
- For billed:
  - Decrease qty in items[] (net qty).
  - Persist via API: POST to /api/TAxnTrnbill/reverse-quantity with txnDetailId, userId.
  - Add to reverseQtyItems with qty: 1 (positive for tracking, but negative in KOT payload).
  - Update revQty in item if needed.
  - Toast: "Reversed 1 qty of [item.name]".
- For unbilled: Keep existing logic (decrease/add to reverseQtyItems).
- Disable if !reverseQtyMode or qty <=0.
- After update, optionally refreshItemsForTable to sync.

Status: [ ] Not started

### 3. Enhance handlePrintAndSaveKOT in Orders.tsx
- If reverseQtyMode && currentTxnId (billed):
  - Include reverseQtyItems in kotPayload.items as negative qty objects (Qty: -item.qty, isReverse: true).
  - Set KOT type to 'Re-KOT' in payload/header.
  - After API success: refreshItemsForTable, clear reverseQtyItems, set reverseQtyMode=false, setIsGroupedView=true.
  - Print Re-KOT preview with reversal highlight.
- For unbilled: Existing logic.
- Ensure combinedPayload handles both new and reverse items.
- Toast: "Re-KOT printed and saved".

Status: [ ] Not started

### 4. Update refreshItemsForTable in Orders.tsx
- In billed bill fetch: Ensure net qty = (Qty - RevQty), and include revQty in item state.
- After reverse API, refetch to update local items[] with latest net qty.
- Handle if no billed/unbilled: Clear reverseQtyItems if mode active.

Status: [ ] Not started

### 5. UI Updates in Orders.tsx
- In item list render: For billed items (isBilled=1) && reverseQtyMode, enable decrease button with reversal icon/color (e.g., red '-').
- In KOT preview: If reverseQtyMode && billed, show "RE-KOT" header, list reverse items with negative qty, highlight in red.
- Add indicator: Badge "Reverse Mode Active" on billed tables.
- Disable Print Bill if reverseQtyMode active (force Re-KOT first).

Status: [ ] Not started

### 6. Update OrderDetails.tsx
- Use reverseQtyMode prop: If reverseQtyMode && parent billed (pass isBilled prop?), disable item cards/search inputs, show message: "Reverse mode active - cannot add new items to billed order".
- In handleAddItem: Early return if reverseQtyMode && billed.
- Add prop: isBilled: boolean (from parent).

Status: [ ] Not started

### 7. Backend Review (if needed)
- Check TAxnTrnbillRoutes.js / Controllers.js: Ensure /reverse-quantity supports billed txnDetailId, updates RevQty in TAxnTrnbillDetails, returns success.
- createKOT: Handle negative Qty for Re-KOT, update KOTNo, print flag.
- If issues, propose edits.

Status: [ ] Not started

### 8. Testing and Followup
- Use execute_command: npm run dev (if not running).
- browser_action: Launch localhost:3000, select table, add items, print bill (billed status), F8 auth, reverse qty, print Re-KOT, verify UI/backend sync.
- Check no regressions in unbilled flow.
- attempt_completion once verified.

Status: [ ] Not started
