# Fix SettlementModal State Lifecycle

## Tasks
- [x] Modify the `useEffect` for updating states when modal opens to include auto-select Cash logic if no initial payment modes are provided and not in mixed mode.
- [x] Remove the separate `useEffect` for auto-selecting Cash to avoid conflicts.
- [x] Ensure the single mode `useEffect` does not conflict with the initialization.
- [x] Verify that selectedPaymentModes and paymentAmounts are properly initialized and never empty on settle.
- [x] Add any necessary validation to prevent settlement with mismatched amounts (though current logic handles balance due).
