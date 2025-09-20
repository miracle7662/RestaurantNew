# TODO: Implement Reverse Qty Mode Feature

## Tasks
- [ ] Add status label in billing panel header showing "Reverse Qty Mode: Active/Off"
- [ ] Modify handleDecreaseQty to handle unbilled items (isBilled === 0) when reverseQtyMode is true
- [ ] Update - button disabled condition to enable for unbilled items in reverse mode
- [ ] Add visual indicator (color change) for - button when applicable
- [ ] Test F8 key press and auth flow
- [ ] Test qty decrease for unbilled items
- [ ] Ensure only unbilled items are affected
