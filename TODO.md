# TrnSettlement table_name Field Addition - TODO

## Plan Progress Tracker

### Backend Schema Update ✅ **Done**
- ✅ Updated backend/config/db.js: Added ALTER TABLE TrnSettlement ADD COLUMN table_name TEXT DEFAULT NULL;


### Backend Controller Updates ✅ **Done**
- ✅ Updated backend/controllers/settlementController.js:
  * Added table_name to SELECT in getSettlements
  * Added table_name to INSERT columns/values in createSettlement and replaceSettlement
  * Handle table_name in req.body/original for inserts

### Frontend UI Update ✅ Pending
- [ ] Read src/views/apps/Transaction/Settelment.tsx content
- [ ] Add table_name form field (dropdown/input)
- [ ] Include table_name in API payloads (create/update/replace)

### Other Controllers ✅ **Done**
- ✅ Checked controllers: Updated TAxnTrnbillControllers.js INSERT to include table_name

### Testing & Verification ✅ Pending
- [ ] Restart backend server
- [ ] Verify schema: PRAGMA table_info(TrnSettlement); or SELECT * FROM TrnSettlement LIMIT 1;
- [ ] Test settlement APIs with table_name
- [ ] Frontend: Test form submission
- [ ] Update TODO.md with completions

**Next Step: Schema update in backend/config/db.js**

