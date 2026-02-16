# Task: Fix Runtime Calculations for Pickup/Delivery/QuickBill

## Problem Statement
In Dine-In, when a table is clicked and items are added, all runtime calculations work correctly (subtotal, tax, discount, round-off, final total).
In Pickup / Delivery / QuickBill, when the tab is selected and items are added, items get added correctly BUT runtime calculations do NOT trigger automatically.

## Root Cause
The tax calculation useEffect in Orders.tsx has dependencies on `[items, reversedItems, taxRates, includeTaxInInvoice, discount, roundOffEnabled, roundOffTo]` but is NOT triggered when:
1. The order type changes (activeTab changes from Dine-In to Pickup/Delivery/QuickBill)
2. The tax rates change after switching order types

## Solution Plan
- [ ] 1. Identify the tax calculation useEffect in Orders.tsx
- [ ] 2. Add `activeTab` to the useEffect dependencies
- [ ] 3. Add `selectedDeptId` and `selectedOutletId` to ensure calculations use the correct tax rates
- [ ] 4. Verify the fix works correctly

## Files to Edit
- `src/views/apps/Transaction/Orders.tsx` - Add dependencies to the tax calculation useEffect
