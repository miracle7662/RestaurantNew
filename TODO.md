# TODO: Update KotTransfer Component State Management

## Tasks
- [ ] Add new state variables: selectedTable (destination, nullable), availableKots (list of KOTs for source), selectedKot (currently selected KOT), items (filtered by selectedKot)
- [ ] Update fetchItemsForTable to populate availableKots from source table items
- [ ] Add logic to filter items based on selectedKot
- [ ] Update UI to include KOT selector for source table
- [ ] Adjust transfer logic to use the new state structure
- [ ] Test the updated component for correct state management
