# TODO: Implement F9 Key Functionality to Reverse Table Orders for Billed Items

## Steps to Complete

- [x] Modify the `handleKeyDown` function in `src/views/apps/Transaction/Orders.tsx` to add a case for 'F9'.
- [x] In the F9 case, check if any items have `isBilled === 1`.
- [x] If billed items exist, reverse the `items` array using `setItems(items.slice().reverse())`.
- [x] Show a success toast message indicating the order has been reversed.
- [x] If no billed items, show an error toast message.
- [x] Test the F9 key press to ensure it works as expected.
