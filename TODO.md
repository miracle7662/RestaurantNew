# TODO - Add Tip Amount Field to Backend

## Task: Add tip amount field to backend for settlement tracking

### Steps:
- [x] 1. Analyze codebase and create plan
- [x] 2. Add TipAmount column to TrnSettlement table in db.js
- [x] 3. Add TipAmount to TrnSettlementLog table in db.js
- [x] 4. Update settlementController.js to handle TipAmount
- [x] 5. Update frontend API service (settlements.ts) to include tip in payload
- [x] 6. Update Settelment.tsx to pass TipAmount to backend
- [ ] 7. Test the implementation

### Files Edited:
1. backend/config/db.js - Added TipAmount column to TrnSettlement and TrnSettlementLog tables + migration code
2. backend/controllers/settlementController.js - Updated replaceSettlement to accept and save TipAmount
3. src/common/api/settlements.ts - Added TipAmount to replace payload type
4. src/views/apps/Transaction/Settelment.tsx - Pass TipAmount when calling replace API

