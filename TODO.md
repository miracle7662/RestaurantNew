# Variant Increment Bug Fix - Orders.tsx
Status: 🔄 In Progress | Priority: High

## Plan Breakdown (3 Steps)

### ✅ Step 1: Create this TODO.md [COMPLETED]

### ⏳ Step 2: Update Orders.tsx handlers + buttons
**Files**: `src/views/apps/Transaction/ords.tsx`
- [ ] Modify `handleIncreaseQty(itemId, variantId?)` + `handleDecreaseQty`
- [ ] Update all `onClick={() => handleIncreaseQty(item.id)}` → pass `item.variantId`
- [ ] Fix grouped item rendering buttons

### ⏳ Step 3: Test & Complete
**Commands**:
```bash
npm run dev
```
- [ ] Test: Add Burger Half + Burger Full → plus buttons work independently
- [ ] Test: F8 reverse mode unchanged
- [ ] Test: Grouping/search unaffected  
- [ ] `attempt_completion`

## Success Criteria
- ✅ Burger (Half) qty +1 → only Half increases
- ✅ Burger (Full) qty +1 → only Full increases  
- ✅ No regressions (grouping, reverse qty, F8)

**Next**: Reply **"step 2"** → I'll edit Orders.tsx
