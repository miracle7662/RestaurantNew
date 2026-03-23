# NC KOT Preview Modal Implementation - TODO

✅ **Step 1**: Create TODO.md (Current)

## Remaining Steps (from approved plan):

**File: `src/views/apps/Transaction/Orders.tsx`**

1️⃣ **Import NCKotPrint** (Top imports section)
```
import NCKotPrint from "../PrintReport/NcKotPrint";
```

2️⃣ **Add States** (Near other useState declarations, e.g. after `tip`, `kotNote`)
```
const [showNCKotPrintModal, setShowNCKotPrintModal] = useState(false);
const [ncPrintItems, setNcPrintItems] = useState<MenuItem[]>([]);
```

3️⃣ **Add NC Filter Logic** (`handlePrintAndSaveKOT()`, after `toast.success('KOT saved successfully!');`)
```
const ncItems = items.filter(i => i.isNCKOT === 1);
if (ncItems.length > 0) {
  setNcPrintItems(ncItems);
  setShowNCKotPrintModal(true);
}
```

4️⃣ **Add Modal JSX** (In `return()` before final `</div>`)
```
<NCKotPrint
  show={showNCKotPrintModal}
  onHide={() => setShowNCKotPrintModal(false)}
  items={ncPrintItems}
  user={user}
  outletName={user?.outlet_name}
  restaurantName={user?.hotel_name}
/>
```

## Progress Tracking
- [ ] Step 1: Import ✅
- [ ] Step 2: States  
- [ ] Step 3: Filter Logic
- [ ] Step 4: Modal JSX
- [ ] Test: Add NC item → Save KOT → Modal → Print → Close

**Next**: Read `src/views/apps/Transaction/Orders.tsx` and implement imports + states.

**After all steps**: `attempt_completion`

