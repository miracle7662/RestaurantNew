# TODO: Implement KOT Persistence and Table Status Reset

## Tasks
- [ ] Modify getAllBills in TAxnTrnbillControllers.js to filter by isBilled and TableID query params
- [ ] Join with menu table in getAllBills to include item names in details
- [ ] In settleBill, after settling, update msttablemanagement set status=0 for the table
- [ ] In Orders.tsx, modify handleTableClick to fetch saved KOTs for tableId and populate items state
- [ ] Test: Add KOT to table, switch tables, verify items persist; settle bill, verify table status resets and items cleared

## Status
- [x] Plan approved by user
- [ ] Implementation in progress
- [ ] Testing completed
