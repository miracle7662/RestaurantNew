# Day End Report Generation Fix

## Issues Identified
- Frontend payload missing outletId
- Backend destructuring only hotelId, businessDate, selectedReports (missing outletId)
- SQL query execution using wrong parameter order: db.prepare(query).all(businessDate, hotelId) instead of (businessDate, outletId)
- No validation for selectedReports array
- No check for isDayEnd = 1 data existence
- Report preview blank due to no data returned

## Tasks to Complete
- [ ] Fix frontend payload to include outletId in handleGenerateReports function
- [ ] Fix backend destructuring to include outletId in generateDayEndReportHTML
- [ ] Correct SQL query parameter order to use outletId instead of hotelId
- [ ] Add validation for selectedReports (ensure it's not empty)
- [ ] Add validation to check if isDayEnd = 1 data exists before generating report
- [ ] Ensure generated HTML is properly returned and stored in sessionStorage
- [ ] Test the complete flow: Generate Report → Preview → Print
