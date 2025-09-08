# TODO: Implement Apply Discount Feature in Orders.tsx

- [ ] Add "Apply Discount" button at the top-right corner of the billing panel.
- [ ] Create a React Bootstrap modal component for discount input with:
  - Input/select for discount percent (0.5% step, range 0.5 - 100)
  - Read-only or dropdown for "Given by" (default current user, override if admin)
  - Optional textarea for discount reason/note
  - "Apply" and "Cancel" buttons
- [ ] Implement validation for discount percent and "Given by" field.
- [ ] Handle modal open/close behavior and accessibility (focus trap, keyboard navigation, aria attributes).
- [ ] On "Apply", validate inputs and call backend API to apply discount (pseudo-code).
- [ ] Update billing panel UI to display applied discount and adjust totals accordingly.
- [ ] Provide backend API specification and pseudo-code for discount application endpoint.
- [ ] Test the feature for UI, validation, accessibility, and integration.
