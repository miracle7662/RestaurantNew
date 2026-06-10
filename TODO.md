# TODO

## Advance Addition fix: Unknown column `hotel_id` in `advance_transactions`

- [ ] Locate current `advance_transactions` table schema (confirm missing `hotel_id`).
- [ ] Create/commit a SQL migration to add `hotel_id` to `advance_transactions`.
- [ ] Ensure `getAdvanceTransactions` filters on `hotel_id` safely.
- [ ] Run backend and retry the failing transaction (Advance Addition) to verify insert works.

