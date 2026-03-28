# Task: Fetch activeTab (pickup/delivery/dine-in) from backend in DuplicateBillPrint.tsx

## Plan Summary
- Extract `Order_Type` from backend response in `handleSearch()`
- Add `activeTab` to `billData` state
- Pass `activeTab={billData.activeTab}` to BillPreviewPrint
- Fallback: 'Pickup' if missing

## Steps
✅ **1. Create TODO.md** (current)

✅ **2. Edit DuplicateBillPrint.tsx**  
- Update `DuplicateBillData` interface (+ activeTab?: string)
- In `handleSearch()`: `const orderType = data.Order_Type || data.orderType || 'Pickup';`
- `setBillData({ ..., activeTab: orderType })`
- `<BillPreviewPrint ... activeTab={billData.activeTab || ''} />`

**3. Test**  
- Load duplicate bill (e.g., pickup order)
- Verify print header shows "Pickup Bill" (or correct type)
- Check console for orderType extraction

✅ **4. Complete**

## Current Status
- ✅ Changes applied
- Ready for testing / completion
