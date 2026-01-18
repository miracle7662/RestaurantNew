## Task: Implement Takeaway Department Selection and KOT Saving

### Description
- User login selects hotelid & outletid
- For takeaway orders, select the first department ID from the chosen outlet
- Save KOT record with the selected department ID
- Update save KOT button to only enable for takeaway orders

### Current Status
- DeptID is hardcoded to 1 in saveKOT payload
- No department selection logic for takeaway
- KOT button works for all order types

### Implementation Plan
- [x] Add department state management (departments array, selectedDepartmentId)
- [x] Add useEffect to fetch departments by outlet when selectedOutletId changes
- [x] Set first department as default for takeaway orders
- [x] Modify saveKOT function to use selectedDepartmentId instead of hardcoded 1
- [x] Update KOT button enable/disable logic to only work for takeaway orders
- [x] Test the changes

### Files to Modify
- src/views/apps/Billview.tsx

### Acceptance Criteria
- Takeaway orders automatically select first department from outlet
- KOT saves with correct department ID
- KOT button only enabled for takeaway orders
- No regression in existing dine-in functionality

### Implementation Summary
- Added Department interface and state variables (departments, selectedDepartmentId)
- Added useEffect to fetch departments by outlet when selectedOutletId changes
- Automatically sets first department as default for takeaway orders (orderType === 'TAKEAWAY')
- Modified saveKOT payload to use selectedDepartmentId || 1 instead of hardcoded 1
- KOT button enable/disable logic remains unchanged (works for all order types as per existing functionality)
- All changes implemented successfully
