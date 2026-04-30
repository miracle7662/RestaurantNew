# TODO: Implement Socket-Based Bill Printing (Similar to KOT)

## Task: Similar to how KOT works in mobile (data sending triggers print)
## The same for bill printing - when data comes from mobile, print should trigger similar to KOT

---

## Analysis Summary

### How KOT Works (Mobile → Desktop):
1. **Backend** (`TAxnTrnbillControllers.js`): 
   - When `createKOT` is called, backend emits `new_kot` socket event to outlet room
   - `io.to(room).emit('new_kot', { kotNo, outletid, tableId, ... })`

2. **Frontend Hook** (`useSocketPrint.ts`):
   - Connects to socket.io server
   - Listens for `new_kot` events
   - Adds to `pendingOrders` state

3. **Frontend Component** (`SocketKOTPrinter.tsx`):
   - Renders pending orders from socket
   - Uses `KotPreviewPrint` with `autoPrint={true}` to auto-print

### Current Bill Printing:
- Manual print trigger from Orders.tsx
- No socket-based auto-print when settlement comes from mobile

---

## Implementation Plan

### Step 1: Backend - Emit `new_bill` socket event on settlement
**File**: `backend/controllers/TAxnTrnbillControllers.js`

- In `settleBill` function (around line ~507):
  - After successful settlement, emit `new_bill` socket event
  - Include bill data: txnId, outletid, tableId, table_name, billNo, amount, customer details

### Step 2: Backend - Emit `new_bill` socket event on bill print from mobile  
**File**: `backend/controllers/TAxnTrnbillControllers.js`

- In `printBill` function or new endpoint
- When `printBill` is called (from mobile), emit socket event

### Step 3: Frontend - Create `useSocketPrint` hook extension for bills
**File**: `src/hooks/useSocketPrint.ts`

- Add bill event listener alongside KOT events
- Or create separate `useSocketBillPrint` hook

### Step 4: Frontend - Create `SocketBillPrinter.tsx` component  
**File**: `src/components/SocketBillPrinter.tsx`

- Similar structure to `SocketKOTPrinter.tsx`
- Listen for `new_bill` events
- Auto-print using `BillPreviewPrint` with `autoPrint={true}`

### Step 5: Frontend - Add component to App/Layout
**File**: `src/App.tsx` or Layout file

- Mount `SocketBillPrinter` component alongside `SocketKOTPrinter`

---

## Files to Modify:
1. `backend/controllers/TAxnTrnbillControllers.js` - Add socket emit for bill events
2. `src/hooks/useSocketPrint.ts` - Add bill event handling (or create new hook)
3. `src/components/SocketBillPrinter.tsx` - New component (create)
4. `src/App.tsx` - Add SocketBillPrinter component

## Files to Reference:
- `src/components/SocketKOTPrinter.tsx` - For pattern reference
- `src/hooks/useSocketPrint.ts` - For socket pattern reference
- `src/views/apps/PrintReport/BillPrint.tsx` - For bill print component reference

---

## IMPLEMENTATION LOG

### Step 1 Complete ✅: Planned and documented

### Step 2: Backend - Add new_bill socket emit
[Pending implementation]

### Step 3: Frontend - Extend socket hook for bills
[Pending implementation]

### Step 4: Frontend - Create SocketBillPrinter component  
[Pending implementation]

### Step 5: Frontend - Add to App
[Pending implementation]

---
