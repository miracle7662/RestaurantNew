# TODO: Implement Pending Delivery Orders Form in Orders.tsx

## Overview
Enhance the pending delivery orders flow in `src/views/apps/Transaction/Orders.tsx` to support selecting a pending order from the list and entering a detailed editable form matching the screenshot. This includes an items table (editable qty), linked pending items section, notes/customer fields, totals, and submit/back buttons. On submit, update the order and proceed to settlement/print.

## Steps

- [ ] **Step 1: Add new states for form view**
  - Add `selectedPendingOrder: any | null = null;`
  - Add `formNotes: string = '';`
  - Add `linkedPendingItems: any[] = [];`
  - Add `showPendingOrderForm: boolean = false;`
  - Ensure `items`, `customerName`, `mobileNumber`, `taxCalc` are reusable in form mode.
  - Update `Orders.tsx` with these states.

- [ ] **Step 2: Update pending orders list UI**
  - In the `showPendingOrdersView` section (card for each order), add an "Edit Order" button next to "Make Payment".
  - On "Edit Order" click: Call `handleSelectPendingOrder(order)`, set `showPendingOrderForm = true`, populate `items` from `order.items`, set `customerName`/`mobileNumber` from `order.customer`, fetch linked items if needed, recompute `taxCalc`.

- [ ] **Step 3: Implement pending order form JSX**
  - Add conditional render: If `showPendingOrderForm && selectedPendingOrder`, show form instead of list.
  - Header: `<h4>Pending Delivery Orders</h4>` with "Back to List" button (sets `showPendingOrderForm = false`).
  - Items table: `<Table>` with columns Item Name, Qty (input with +/- like existing), Amount (calculated). Bind to `items`, allow qty edits via handlers.
  - Linked pending items: `<Table>` listing `linkedPendingItems` (columns: Item Name, Qty, Amount, checkbox to link). On check, append to `items`.
  - Fields: Mobile No. (input, fetch customer), Customer (readonly), Notes (textarea for `formNotes`).
  - Totals: Display Subtotal/Grand Total from `taxCalc`.
  - Buttons: "Back to List", "Submit" (calls `handleSubmitPendingOrder`).
  - Use Bootstrap: Row/Col for layout, blue styling for buttons/inputs.

- [ ] **Step 4: Add handlers and logic**
  - `handleSelectPendingOrder(order: any)`: Set states, populate form data, fetch linked items (e.g., via new API `getLinkedPendingItems(order.id)` if added).
  - Adapt `handleIncreaseQty`/`handleDecreaseQty` for pending items (update local `items`).
  - `handleLinkPendingItem(item: any, checked: boolean)`: Add/remove from `items` if checked.
  - `handleSubmitPendingOrder()`: Validate (e.g., notes optional, items >0), call API to update order (e.g., `updatePendingOrder(selectedPendingOrder.id, {notes: formNotes, items, linkedItems})`), then proceed to settlement modal (`setShowSettlementModal(true)`).
  - Recompute `taxCalc` on item changes (leverage existing useEffect).

- [ ] **Step 5: API updates (if needed)**
  - In `src/common/api/orders.ts`: Add `updatePendingOrder(id: number, data: {notes: string, items: any[], linkedItems?: any[]})` (POST/PUT to `/api/TAxnTrnbill/${id}/update`).
  - Add `getLinkedPendingItems(orderId: number)` if aggregation required (fetch from backend).
  - Backend: In `backend/controllers/TAxnTrnbillControllers.js`, add endpoint for update (handle notes/items/linking, update DB). Add route in `backend/routes/TAxnTrnbillRoutes.js` if new.

- [ ] **Step 6: Styling and edge cases**
  - Match screenshot: Blue buttons (`btn-primary`), form layout, input placeholders.
  - Handle: Empty linked items (show message), validation errors (toasts), loading (Spinner), no items (disable submit).
  - Ensure responsive (use existing media queries).

- [ ] **Step 7: Testing**
  - Run `npm run dev`, test: Delivery tab → pending list → Edit Order → form loads → edit qty/notes/link items → totals update → Submit → settlement.
  - Verify: Customer auto-fill, calculations, no console errors.
  - If backend: Test API endpoints separately (e.g., Postman).

- [ ] **Step 8: Cleanup and completion**
  - Update TODO.md with completions.
  - Use `attempt_completion` once verified.

Progress: 0/8 steps complete.
