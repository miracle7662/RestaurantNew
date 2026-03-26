# Day End Report Fix - TODO Steps

## Plan Approved ✅
**Current Working Directory**: `d:/Github/RestaurantNew`

### Step 1: [✅ DONE] Fix Frontend Key Mismatch
- File: `src/views/apps/Transaction/DayEnd.tsx`
- Change: `reverseBillSummary` → `'reverseBills'`
- Change: `ncKOTSalesSummary` → `'ncKOTSummary'`

### Step 2: [✅ DONE] Add Debug Logs to Controller
- File: `backend/controllers/Dayendcontroller.js`
- Added logs to `getReverseBillsData()`, `getNCKOTsData()`
- Add logs to `generateDayEndReportHTML()` switch cases

### Step 3: [✅ DONE] Fix Date Filter (Timezone Safe)
- File: `backend/controllers/Dayendcontroller.js`
- Updated date filter to `DATE(TxnDatetime, '+05:30')`

### Step 4: [PENDING] Test Full Flow
- Complete DayEnd → Generate Report → Verify data
- Check server console logs
- Query DB for reverse/NC KOT counts

### Step 5: [PENDING] Verify & Complete
- Confirm both reports show data
- Remove debug logs
- attempt_completion

**Next**: Step 1 - Edit frontend keys

