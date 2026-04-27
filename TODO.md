# Fix: Pickup/Delivery/QuickBill Showing Other Hotel's Menus

## Steps
- [ ] Step 1: Pass `selectedOutletId` prop from Orders.tsx to OrderDetails.tsx
- [ ] Step 2: Update OrderDetails.tsx props interface and fetch menus with hotelid/outletid filters
- [ ] Step 3: Update menu-fetching useEffect to re-run when selectedOutletId changes
- [ ] Step 4: Update `fetchMenu` in `src/utils/commonfunction.ts` to accept optional params
- [ ] Step 5: Update `fetchMenu` in `src/utils/masterFetchers.ts` to accept optional params
- [ ] Step 6: Test and verify

