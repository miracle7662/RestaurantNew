# Dayend Data Fetch Fix - TODO Steps

## Approved Plan Status: ✅ Confirmed by user

**✅ Step 1: Create TODO.md** - *Completed*

**⏳ Step 2: Edit backend/controllers/Dayendcontroller.js**
- Add outlet_id, hotel_id params validation
- Fix WHERE clause with outlet/hotel filter + relaxed conditions for reverse/nc/discount
- Update query execution with params
- Add response logging

**⏳ Step 3: Test Changes**
```
# Backend restart
cd backend && npm start

# Test endpoint (replace with actual IDs)
curl "http://localhost:3001/dayend/data?outlet_id=YOUR_OUTLET_ID&amp;hotel_id=YOUR_HOTEL_ID"

# Check DB sample data
sqlite3 db.sqlite "SELECT TxnNo, isreversebill, Discount FROM TAxnTrnbill WHERE outletid=? LIMIT 5;"
```

**⏳ Step 4: Frontend Integration Check**
- Verify DayEnd report fetches correctly
- Test reversebill/nckot/discount visibility

**⏳ Step 5: Complete & Verify**
- Confirm consistent data fetching
- Update TODO.md with completion
- attempt_completion

**Next Action:** Edit Dayendcontroller.js
