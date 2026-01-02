# Implement Runtime Tax Calculation in Billview.tsx

## Plan Steps
1. Add new state variables: igstRate, cessRate, includeTaxInInvoice, totalIgst, totalCess, discountAmount.
2. Update fetchTaxDetails to set igstRate, cessRate, includeTaxInInvoice from response (default to 0/false if not present).
3. Extend BillItem interface to include igst and cess.
4. Update loadBillForTable and loadUnbilledItems to include igst: 0, cess: 0 in mapped items.
5. Modify calculateTotals to handle discount, inclusive/exclusive tax, IGST, CESS, and update item-level taxes.
6. Update summary table to include IGST and CESS columns, and show actual discount amount.
7. Add useEffect to recalculate totals on changes to discount, discountType, tax rates, includeTaxInInvoice.
