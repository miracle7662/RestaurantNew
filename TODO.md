# Task: Fix Quick Bill panel clearing after handlePrintKotAndBill()

## Steps:
- [ ] Step 1: Edit Orders.tsx - Modify handlePrintBill() to conditionally skip setItems([]) for Quick Bill
- [ ] Step 2: Edit Orders.tsx - Modify handlePrintKotAndBill() end to conditionally skip final clears for Quick Bill  
- [ ] Step 3: Test Quick Bill flow: add items → print → verify panel persists
- [ ] Step 4: Complete task

**Approved Plan**: Skip clearing items[]/billing panel for Quick Bill tab only. Items/totals persist post-print.
