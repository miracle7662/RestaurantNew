# KOT Features Implementation TODO

## Completed Steps
- [x] Step 1: Update MenuItem Interface - Added `isNew: boolean` to MenuItem interface in Orders.tsx
- [x] Step 4: Update Item Addition in OrderDetails - OrderDetails.tsx sets isNew=true for new items
- [x] Step 6: Add Highlighting for New Items - Conditional styling (yellow background) for isNew=true
- [x] Step 2: Fetch Menu Data for Mapping - fetchMenu and fetchMenuItems are implemented in OrderDetails.tsx
- [x] Step 3: Modify handleTableClick - Clears items, fetches saved KOTs, maps to MenuItem format, sets isNew=false

## Remaining Steps
## Step 5: Modify handlePrintAndSaveKOT
- [ ] Filter newItems = items.filter(i => i.isNew)
- [ ] Send only newItems to createKOT API
- [ ] Update sent items to isNew=false
- [ ] Update KOT preview to show only newItems

## Step 7: Ensure Table Switching Reloads KOTs
- [ ] Verify handleTableClick clears and reloads properly on table switch

## New Steps from Plan
## Step 9: Add Table Color Logic
- [ ] Mark table color green if status=1 and isBilled=0

## Step 10: Display KOTNo in UI
- [ ] Display KOTNo in the UI (e.g., in KOT preview or table info)

## Step 11: Test and Verify
- [ ] Test KOT creation with new items only
- [ ] Test loading saved KOTs on table click
- [ ] Test highlighting of new items
- [ ] Test print preview shows only new items
- [ ] Test table color changes
- [ ] Test KOTNo display
