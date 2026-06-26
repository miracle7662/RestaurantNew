# TODO - Refactor RoomDetailSummary.tsx fetchData()

- [ ] Inspect current RoomDetailSummary.tsx fetchData() and identify reconstruction logic to delete.
- [ ] Identify which fields are already present in stored procedure rows (based on usage/mapping inside current fetchData).
- [ ] Rewrite fetchData() to:
  - [ ] Call API
  - [ ] Use only `rows = fullDetailsRes.data || []`
  - [ ] Create `displayRows = rows.map(row => ({ ... }))` without maps/find matching
  - [ ] Set `setDisplayRows(displayRows)`
  - [ ] Compute only required UI summaries (billDateSummary + combinedSummary) without business reconstruction.
- [ ] Remove dead/unused helpers that become unnecessary.
- [ ] Run TypeScript/lint checks (npm test/build or `npm run build`) to ensure no TS errors.

