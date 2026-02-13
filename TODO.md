# Refactoring Orders.tsx - TODO

## Task
Refactor an existing large React function that fetches billed and unbilled restaurant orders into a clean, scalable architecture.

## Steps

- [ ] 1. Create `src/services/order.ts` - API service layer
- [ ] 2. Update `src/hooks/useOrder.ts` - Add comprehensive useOrder hook
- [ ] 3. Refactor `src/views/apps/Transaction/Orders.tsx` - Use the hook

## Progress

### Step 1: Create services/order.ts
- [ ] Create the file with OrderService class
- [ ] Add getBilledBillByTable function
- [ ] Add getUnbilledItemsByTable function

### Step 2: Update hooks/useOrder.ts
- [ ] Add comprehensive useOrder hook
- [ ] Implement refreshItemsForTable with orchestration logic

### Step 3: Refactor Orders.tsx
- [ ] Import useOrder hook
- [ ] Remove API URLs and fetch calls
- [ ] Use refreshItemsForTable from hook
