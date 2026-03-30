# NC KOT Enhancement - **IN PROGRESS** 🔄

✅ **Previous Task:** discountSummary Fix - **COMPLETED** ✅

## 📋 NC KOT Implementation Steps

### ✅ Step 1: Backend verification ✓
- 'ncKOT' filters `NCKOT IS NOT NULL AND NCKOT != ""` ✓
- Returns individual TxnID bills with ncKot/GROUP_CONCAT, ncPurpose, ncName ✓

### ✅ Step 2: Update calculateNCKOTDetails()
- Map filteredBills → individual bills with ncKotDetails {ncKot, ncPurpose, ncName}

### [ ] Step 3: Update renderNCKOTSection()
- 15-col table like discountSummary:
  | Bill No | Date | Customer | NC KOT | NC Purpose | NC Name | Gross | Net | Total | Payment | Waiter | Captain | Order Type | Outlet | Table |
- Header: "📋 NC KOT Summary (X bills)"
- Totals footer ✓

### [ ] Step 4: Test & cleanup
- Select ncKOT → verify individual TxnDatetime bills + NC details table
- Update TODO complete
- attempt_completion

**Current Progress:** Backend ready, frontend updates next.
