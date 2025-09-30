# TODO: Clear Table After Bill Settlement

## Tasks
- [x] Modify settleBill function to set table status to 0 (vacant) after settlement
- [x] Modify getLatestBilledBillForTable to only fetch unsettled billed bills (add isSetteled = 0)

## Details
- In settleBill, add db.prepare('UPDATE msttablemanagement SET status = 0 WHERE tableid = ?').run(bill.TableID); in the transaction after the bill updates.
- In getLatestBilledBillForTable, change the WHERE clause to WHERE TableID = ? AND isBilled = 1 AND isSetteled = 0
