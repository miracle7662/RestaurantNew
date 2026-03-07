# TODO: Fix Department Price Not Being Used When Adding Items to Order

## Task
When items are added to the order, they use base price instead of department price. The `getDisplayPrice` function exists and is used for display, but not when adding items.

## Steps to Complete

### Step 1: Fix handleQuantityKeyPress function
- Location: Line ~480 in OrderDetails.tsx
- Issue: Uses `selectedCodeResult.price` and `item.price` directly
- Fix: Use `getDisplayPrice()` to get department price
- Status: ✅ COMPLETED

### Step 2: Fix handleShowVariantModalForQty function
- Location: Line ~520 in OrderDetails.tsx
- Issue: Uses `item.price` directly when adding items
- Fix: Use `getDisplayPrice()` to get department price
- Status: ✅ COMPLETED

### Step 3: Fix handleShowVariantModal function
- Location: Line ~560 in OrderDetails.tsx
- Issue: Uses `item.price` directly when adding items
- Fix: Use `getDisplayPrice()` to get department price
- Status: ✅ COMPLETED

## Status: [COMPLETED]
All three functions now use `getDisplayPrice(item.userId, item.price, selectedDeptId)` instead of directly using `item.price` when adding items to the order.

