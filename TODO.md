# Billview Variant Price Fix - TODO

## Current Work
Fixing Billview item input: When entering item_no, default to FIRST variant price/name instead of base price. Only show variant price after selection.

## Plan Steps (Approved by User)

### [ ] Step 1: Add state for variant tracking
- Add `needsVariantSelection?: boolean` to BillItem interface
- Track if item needs variant selection

### [ ] Step 2: Update handleItemChange logic for itemCode
```
if (NO variantId):
  if (has variants):
    - Auto-select FIRST variant: rate=first.item_rate, itemName=`name (variant_name)`, variantId=first.id
  else:
    - rate = found.price (base, no variants case)
else:
  - Use specific variant logic (existing)
```

### [ ] Step 3: Update table Rate column display
```
if (needsVariantSelection):
  Show "Select Variant" 
else:
  Show formatted rate ₹{rate}
```

### [ ] Step 4: Fix itemName parsing in itemName field
- Ensure variant name preserved when typing in name field

### [ ] Step 5: Test & Verify
```
1. Enter item_no → shows first variant name/price
2. Enter item_no|variant_id → specific variant
3. No variants → base price OK
4. Table shows correct "Select Variant" state
```

**Next Step:** Implement Step 1-2 (core logic changes)
