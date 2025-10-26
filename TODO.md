# TODO: Add Total Rows to exportToExcel for All Report Categories

## Steps:
1. **Analyze each report category** in exportToExcel function to identify numeric fields for totaling.
2. **Modify billSummary category** (already has totals, ensure it's correct).
3. **Add totals for creditSummary**: Sum "Amount" field.
4. **Add totals for discountSummary**: Sum "Amount" field.
5. **Add totals for reverseKOTs**: Sum numeric fields like Gross Amount, Discount, etc.
6. **Add totals for kitchenWise**: Sum "Sales" field.
7. **Add totals for ncKOT**: Sum numeric fields.
8. **Add totals for apcApp**: Sum "Amount" field.
9. **Add totals for specialItems**: Sum "Sales" field.
10. **Add totals for interDeptCash**: Sum "Amount" field.
11. **Add totals for dailySalesUserShift**: Sum "Sales" field.
12. **Add totals for monthlySales**: Sum "Sales" field.
13. **Add totals for paymentModeSales**: Sum "Sales" field.
14. **Add totals for kitchenAllocation**: Sum relevant fields if applicable.
15. **Skip totals for dayEnd, handover** (single rows).
16. **Add totals for billReprinted**: Sum numeric fields if applicable.
17. **Add totals for kotUsedSummary**: Sum "Items" field.
18. **Test the export** to ensure totals are correct and Excel files generate properly.
