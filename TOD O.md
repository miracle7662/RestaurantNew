# Fix TypeScript Errors in Tableview.tsx

## Tasks:
- [x] Analyze the TypeScript errors in Tableview.tsx
- [ ] Fix lines 144-145: Add type assertion for TableManagementService.list() response
- [ ] Fix lines 160-161: Fix type issue with OrderService.getBillStatus() response
- [ ] Fix line 223: Add proper typing for fetchTakeawayOrders response

## Issues:
1. Line 144-145: 'response' is of type 'unknown'
2. Line 160-161: Property 'success' and 'data' do not exist on type 'BillStatusResponse'  
3. Line 223: 'data' is of type 'unknown'
