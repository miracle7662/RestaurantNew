# Tax-Inclusive Total Display Fix - TODO

## Approved Plan Summary
- Replace `order.total` → `order.Amount` (backend tax-inclusive) in pending orders cards
- Update PendingOrder interface (optional)
- Test: Pending pickup/delivery cards show correct tax-inclusive totals

## Implementation Steps ✅

### [x] Step 1: Create this TODO.md ✅

### [x] Step 2: Orders.tsx analyzed - pending orders block confirmed at ~line 3800 ✅

### [x] Step 3: ✅ FIXED Orders.tsx pending orders total
```
<span> ₹{(order.Amount || order.GrandTotal || order.amount || order.total || 0).toFixed(2)}</span>
```
**Backend sends `Amount` (tax-inclusive), now used with fallbacks**

### [ ] Step 4: Update PendingOrder interface (optional - backend sends Amount)

### [ ] Step 5: Test verification

### [ ] Step 6: Update TODO.md → attempt_completion

- Use edit_file with exact string match

### [ ] Step 4: Update PendingOrder interface in order.ts (if Amount missing)
- Add `amount?: number; grandTotal?: number;`

### [ ] Step 5: Test verification
- No CLI command needed - visual browser test

### [ ] Step 6: Update TODO.md → attempt_completion

