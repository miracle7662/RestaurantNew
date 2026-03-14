# Billview Item Dropdown Fix - Prevent Auto-Selection on Short Code Typing

## Plan Breakdown (5 Steps)

### ✅ Step 1: Create TODO.md [COMPLETED]

### ⏳ Step 2: Add New States & Refs in Billview.tsx
```
- const [codeSearchFilter, setCodeSearchFilter] = useState('');
- const [pendingItemCode, setPendingItemCode] = useState('');
- const [selectedCodeIndex, setSelectedCodeIndex] = useState(-1);
- const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
```

### ⏳ Step 3: Add handleCodeKeyDown() Function
```
- Arrow Up/Down: Navigate datalist options
- Enter: Confirm selection → populate item details → focus qty
- Escape: Clear dropdown
- Blur: Hide dropdown after 200ms
```

### ⏳ Step 4: Modify handleItemChange('itemCode')
```
OLD: Typing code → immediately populate itemName/rate/itemId
NEW: Typing → ONLY filter datalist (#itemNos) via codeSearchFilter
     Enter → THEN populate fields
```

### ⏳ Step 5: Update datalist #itemNos & Test
```
- Dynamic filter: item_no.startsWith(codeSearchFilter)
- Show context: `${name} | ₹${price}`
- Test: type partial code → search | Enter → select & populate
```

## Current Progress: 1/5 (20%)
Next: Edit Billview.tsx (Steps 2-4)

**Run after completion:**
```bash
npm run dev
# Test: Billview → type partial item code → ONLY search, no auto-fill → Enter → populate ✓
```

