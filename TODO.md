# TODO: Implement Table Click to Navigate to Billview with Table ID

## Steps to Complete:
- [ ] Update TableCard component in Tableview.tsx to accept onClick prop and attach it to the div.
- [ ] Add handleTableClick function in the main App component of Tableview.tsx to navigate to '/apps/Billview' with tableId in state.
- [ ] Pass the handleTableClick to each TableCard in the table grid.
- [ ] Update Billview.tsx to use useLocation to retrieve tableId from state and log it.
- [ ] Test the navigation by clicking a table and verifying Billview loads with tableId.
