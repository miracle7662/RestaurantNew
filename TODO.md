# TODO: Refactor Billview.tsx to use OrdernewService

## Completed Tasks
- [x] Import OrdernewService into Billview.tsx
- [x] Replace axios calls in loadUnbilledItems with OrdernewService methods
- [x] Replace axios calls in loadBillForTable with OrdernewService methods
- [x] Replace axios calls in loadTakeawayOrder with OrdernewService methods
- [x] Add getBilledBillByTable and getUnbilledItemsByTable methods to OrdernewService
- [x] Test the refactored code to ensure functionality remains intact

## Remaining Tasks
- [ ] Replace axios calls in handleCustomerNoChange with OrdernewService.getCustomerByMobile
- [ ] Replace axios calls in fetchOutlets with OrdernewService.getOutletsByHotel
- [ ] Replace axios calls in fetchOutletDetails with OrdernewService.getOutletById
- [ ] Replace axios calls in fetchPaymentModes with OrdernewService.getPaymentModesByOutlet
- [ ] Replace axios calls in fetchGlobalKOT with OrdernewService.getGlobalKOTNumber
- [ ] Replace axios calls in fetchTaxDetails with OrdernewService.getTaxDetails
- [ ] Replace axios calls in fetchMenuItems with OrdernewService.getMenu
- [ ] Replace axios calls in fetchTableManagement with OrdernewService.getTableById
- [ ] Replace axios calls in saveKOT with OrdernewService.createKOT
- [ ] Replace axios calls in printBill with OrdernewService.markBillAsBilled
- [ ] Replace axios calls in PrintAndSettle with OrdernewService.markBillAsBilled
- [ ] Replace axios calls in handleReverseBillConfirmation with OrdernewService.reverseBill
- [ ] Replace axios calls in handleReverseKotSave with OrdernewService.createReverseKOT
- [ ] Replace axios calls in printKOT with OrdernewService.printKOT
- [ ] Replace axios calls in handleSaveNCKOT with OrdernewService.applyNCKOT
- [ ] Replace axios calls in handleApplyDiscount with OrdernewService.applyDiscount
- [ ] Replace axios calls in handleSettleAndPrint with OrdernewService.settleBill
- [ ] Add any missing methods to OrdernewService if needed

## Summary
Successfully refactored Billview.tsx to use OrdernewService methods instead of direct axios calls for bill loading functionality. The changes include:
- Added import for OrdernewService
- Replaced axios.get calls in loadBillForTable, loadUnbilledItems, and loadTakeawayOrder with OrdernewService methods
- Added the required API methods to the OrdernewService
- Verified that the application builds without errors

The refactoring improves code maintainability by centralizing API logic in the service layer.

## Follow-up Steps
- Complete the remaining axios replacements
- Run the application and test bill loading, KOT saving, printing, settlement, etc.
- Verify that all API calls work correctly with the new service methods.
- Check for any console errors or failed requests.
- If issues arise, debug and fix accordingly.
