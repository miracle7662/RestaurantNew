# TODO: Implement Reverse Qty Mode with F8 Key Handling

## Steps
- [ ] Add reverseQtyConfig state in Orders.tsx ('NoPassword' or 'PasswordRequired')
- [ ] Add F8 key event listener in Orders.tsx to handle mode toggle based on config
- [ ] Update auth modal logic to toggle reverseQtyMode on valid auth
- [ ] Add status label in OrderDetails.tsx for "Reverse Qty Mode: Active/Off"
- [ ] Make item rows clickable in reverse mode to decrease qty by 1
- [ ] Modify handleDecreaseQty in Orders.tsx to work for all items
- [ ] Test F8 key press
- [ ] Test password authentication
- [ ] Test qty decrease functionality
