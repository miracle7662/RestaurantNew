# TODO: Implement Pending Orders Modal for Pickup and Delivery in Orders.tsx

## Overview
This TODO tracks the implementation of a large modal for displaying pending Pickup and Delivery orders when their navbar tabs are clicked. The modal will match the sizing and layout style of OrderDetails.tsx (full viewport height/width, responsive grid). Each order will be shown as a card with customer details, items, totals, and a "Make Payment" button integrating with the existing settlement flow. Data will be fetched via a new API endpoint `/api/pending-orders?type=${type}` (using mock data if API not ready).

## Steps

### 1. Add New States
- Add states in Orders.tsx: `showPendingModal` (boolean), `pendingType` ('pickup' | 'delivery' | null), `pendingOrders` (array of order objects), `loadingPending` (boolean), `errorPending` (string | null).
- Mark as [x] Complete.

### 2. Add fetchPendingOrders Function
- Implement async function `fetchPendingOrders(type: string)` to fetch from `/api/pending-orders?type=${type}`.
- Handle loading, errors, and set `pendingOrders` (use mock data array if fetch fails, e.g., sample orders with customer, items, totals).
- Mark as [x] Complete.

### 3. Update Navbar Tab Handlers
- Modify the onClick for "Pickup" and "Delivery" tabs in the navbar: Set `showPendingModal = true`, `pendingType = type`, and call `fetchPendingOrders(type)`.
- Ensure other tabs (e.g., Dine In) remain unchanged.
- Mark as [x] Complete.

### 4. Add PendingOrdersModal JSX
- Add Bootstrap Modal with size="xl", fullscreen on mobile, custom class "pending-modal".
- Structure: Header (title based on type, close button), Body (scrollable container-fluid vh-100 flex-column p-0 like OrderDetails, with navbar if needed, Row grid for cards), Footer (close button).
- Add inline <style> for modal sizing (vh-100, calc max-height), card styles (bordered, hover like OrderDetails).
- useEffect: Fetch on modal show + type change; clear on hide.
- Mark as [x] Complete.

### 5. Implement OrderCard Sub-Component
- Create inline functional component for each order card: Inputs for customer name/mobile, list of items (<ul> or <div> with name, Qty @ price), totals (Qty: X, Amount: ₹Y), pink "Make Payment" button (btn btn-danger).
- On button click: Call existing `handleSettlement` with order data (id, total), close modal after success.
- Grid: Row md=2 (2-column on desktop, 1 on mobile), g-3.
- Handle empty/loading/error states.
- Mark as [x] Complete.

### 6. Integrate with Existing Settlement Flow
- Ensure "Make Payment" passes order ID/total to `handleSettlement` or opens settlement modal with pre-filled data.
- Test integration without breaking dine-in flow.
- Mark as [x] Complete.

### 7. Testing and Cleanup
- After all edits: Run `npm run dev`, test modal open on tab click, display cards, payment flow.
- Update TODO: Mark steps [x] Complete.
- Handle any linter errors or responsive issues.
- If API needed, note for backend update in TAxnTrnbillControllers.js.
- Mark as [x] Complete.

## Progress
- Total Steps: 7
- Completed: 6/7

Last Updated: [Current Date]
