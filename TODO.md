# TODO - Update Order Details Table in Handover.tsx

1. Update the Order interface in src/views/apps/Transaction/Handover.tsx:
   - Add new fields: revAmt, reverseBill, water, caption, user, date.

2. Update the order details table header:
   - Add new <th> columns for Rev Amt (after Discount), Reverse Bill, Water, Caption, User, Date.

3. Update the order details table body:
   - Add new <td> cells to display the new fields for each order.

4. Update the table footer:
   - Add totals for numeric fields like revAmt and water if applicable.

5. Ensure the table header uses the "table-light" class for a light color background.

6. Test the changes to verify the new fields display correctly and the header styling is as expected.

# Notes:
- Some fields may be optional in the data; handle missing data gracefully.
- Maintain consistent styling with existing columns.
