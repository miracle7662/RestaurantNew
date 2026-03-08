# TODO - Datalist Filter Implementation

## Task: Filter datalist variants based on item_no input

### Current Issue:
- When user types item number (e.g., "1"), datalist shows variants of ALL items
- Expected: Only show variants of item_no matching the typed value

### Plan:

1. **Add state for item code input tracking**
   - Add `itemCodeInput` state to track current input value in the search field
   
2. **Create filtered variants computed value**
   - Use `useMemo` to filter variants based on input
   - Match items where `item_no` starts with the input value
   - Extract unique variants from `department_details`
   
3. **Update the datalist rendering**
   - Replace static datalist with filtered variants only
   - Keep format: `item_no-variant_name`
   - Label: `item_name (variant_name) - ₹price`

4. **Handle item selection**
   - Parse the selected value to extract item_no and variant info
   - Auto-fill rate from variant's price

### Files to Modify:
- `src/views/apps/Billview.tsx`

### Implementation Details:

1. Add state:
```typescript
const [itemCodeInput, setItemCodeInput] = useState('');
```

2. Create filtered variants:
```typescript
const filteredItemVariants = useMemo(() => {
  if (!itemCodeInput.trim()) {
    // If no input, show all variants (current behavior)
    return getAllVariants();
  }
  // Filter items whose item_no starts with input
  return menuItems
    .filter(item => item.item_no?.toString().startsWith(itemCodeInput))
    .flatMap(item => extract variants from department_details);
}, [itemCodeInput, menuItems]);
```

3. Update input handler:
```typescript
const handleItemCodeChange = (index: number, value: string) => {
  setItemCodeInput(value); // Track input for filtering
  handleItemChange(index, 'itemCode', value);
};
```

4. Update datalist:
```tsx
<datalist id="itemNos">
  {filteredItemVariants.map(variant => (
    <option key={variant.key} value={variant.value} label={variant.label} />
  ))}
</datalist>
```

### Expected Output Example:
- User types "1" → Shows:
  - 1-Half   Pizza (Half) - ₹300
  - 1-Full   Pizza (Full) - ₹500
  - 1-Quarter Pizza (Quarter) - ₹150

### Testing:
- Type "1" → Only show item 1 variants
- Type "12" → Only show item 12 variants
- Type empty → Show all variants (optional, can also show none)

