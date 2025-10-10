# Task: Update Billing Panel UI for Reversed Items

## Steps to Complete

- [ ] Update the reversed items rendering section in `src/views/apps/Transaction/Orders.tsx`:
  - Add a bold red "Reversed" badge next to the item name in the name column for each reversed item row.
- [ ] In the same section, update the quantity column to display disabled quantity controls (`-` button, read-only input with qty, `+` button) matching the normal items' structure and styling.
- [ ] Ensure the amount column displays the negative amount (e.g., `-(price * qty).toFixed(2)`) as the main value, with the positive rate in small gray text below in parentheses (e.g., `(price.toFixed(2))`).
- [ ] Verify no changes to Group View (reversed items remain hidden).
- [ ] After code updates, run the app locally (`npm run dev`) and test in Expand View to confirm UI matches the screenshot (light red background, bold red badge, quantity controls, negative amount with rate).
