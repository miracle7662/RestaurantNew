# TODO: Implement Printed Bill Time Display and Pending Logic

## Tasks
- [ ] Add billPrintedDate field to Table interface
- [ ] Update fetchTables to store billPrintedDate as Date object
- [ ] Implement logic to change status to 'running-kot' if 10+ minutes since billPrintedDate
- [ ] Add setInterval in useEffect to periodically update table statuses
- [ ] Test the implementation for correct behavior
