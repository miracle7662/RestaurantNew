# TODO: Implement Day End Functionality

- [x] Create migration file for trn_dayend table
- [x] Add system_datetime and lock_datetime columns to trn_dayend table
- [x] Fix saveDayEnd logic in TAxnTrnbillControllers.js: accept system_datetime, calculate business_date and lock_datetime
- [x] Update DayEnd.tsx to send system_datetime in the API call
- [x] Run migration to add new columns
- [ ] Test the day end API
- [ ] Ensure routes are registered
