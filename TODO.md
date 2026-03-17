# Task: Enable Discount/NCKOT buttons after adding items to Pickup/Delivery/QuickBill tabs

## Approved Plan Summary
- **Objective**: Enable discount/NCKOT buttons immediately after first item added (`items.length > 0`) for pickup/delivery/quickbill tabs.
- **File**: `src/views/apps/Transaction/Orders.tsx` only.
- **Approach**: 
  1. Set virtual `sourceTableId` for non-dinein tabs
  2. Update button `disabled` conditions
  3. Guard `refreshItemsForTable` for virtual IDs

## Steps to Complete [1/5]

### ✅ Step 1: Create this TODO.md [DONE]

### ⏳ Step 2: Read full Orders.tsx content again (use tail if needed)
```
Use: read_file(path="src/views/apps/Transaction/Orders.tsx")
```

### ☐ Step 3: Implement virtual sourceTableId in handleTabClick()
- Location: handleTabClick function (~line 1800)
- Add: `setSourceTableId(tab === 'Quick Bill' ? -1 : 0);` inside pickup/delivery/quickbill block

### ☐ Step 4: Update button disabled conditions
- Location: Floating options buttons (~lines 3800-3850)
```
Discount: disabled={items.length === 0 || (activeTab === 'Dine-in' && !sourceTableId)}
NCKOT:   disabled={items.length === 0 || (activeTab === 'Dine-in' && !sourceTableId)}
```

### ☐ Step 5: Guard refreshItemsForTable for virtual IDs
- Location: refreshItemsForTable (~line 1200)  
- Add: `if (tableIdNum <= 0) return;`

### ☐ Step 6: Test & Complete
- Manual test: Pickup tab → Add item → Discount/NCKOT buttons enable ✅
- Run `attempt_completion`

**Next Action**: Execute Step 2 by reading the file again for precise line matching.

