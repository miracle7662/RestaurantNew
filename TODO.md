# TODO for Reversed Items UI Update in Orders.tsx

## Current Work
Updating the frontend UI in src/views/apps/Transaction/Orders.tsx to display reversed items matching the second image: pink header with title and negative total, followed by pink rows with item name + " Reversed", disabled quantity controls (- qty +), and price display.

## Key Technical Concepts
- React with TypeScript (TSX), Bootstrap for styling.
- State management with useState for reversedItems (ReversedMenuItem[]).
- Inline calculations for totals; no new hooks or dependencies.
- UI rendering in item-list-container div using grid layout for consistency.

## Relevant Files and Code
- src/views/apps/Transaction/Orders.tsx
  - Existing reversed items section: Around line where {!isGroupedView && reversedItems.length > 0 && (...)} – simple red header and rows.
  - Main items rendering: Uses gridTemplateColumns: '2fr 1fr 1fr' for name, qty controls, amount.
  - Fetch logic: In refreshItemsForTable, sets reversedItems from API response.

## Problem Solving
- Current UI: Conditional on expanded view, no total, basic red styling, no buttons or "Reversed" suffix.
- Solution: Always display if items exist, add total calculation, pink styling (#f8d7da), append " Reversed", disabled buttons for visual match, negative amounts.

## Pending Tasks and Next Steps
- [ ] Step 1: Add inline totalReversedAmount calculation just before the reversed items rendering section. Use: const totalReversedAmount = reversedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  - "Quote: 'To match the second image, I'll update the display to include a pink header with "Reversed Items" and total (e.g., -560.00)' from plan."
- [ ] Step 2: Remove the {!isGroupedView && } condition around the reversed items section to always show when reversedItems.length > 0.
  - Place it after the closing of the main items map (after return itemsToDisplay.map(...); } ) inside the item-list-container.
- [ ] Step 3: Update the header div: Change className to include bg-danger-subtle or style backgroundColor: '#f8d7da', add below the title: <div className="text-danger fw-bold">-{(totalReversedAmount).toFixed(2)}</div>
  - Ensure centered, bold title "Reversed Items".
- [ ] Step 4: Update each reversed item row: Append " Reversed" to item.name, change background to '#f8d7da', qty section: <div className="d-flex justify-content-center align-items-center gap-2"><button disabled className="btn btn-danger btn-sm p-0">-</button><span className="fw-bold">{item.qty}</span><button disabled className="btn btn-success btn-sm p-0">+</button></div>, amount: <div className="text-center"><div className="text-danger">-{ (item.price * item.qty).toFixed(2) }</div><div style={{fontSize: '0.75rem', color: '#6c757d'}}>({item.price.toFixed(2)})</div></div>
  - Match grid: '2fr 1fr 1fr'.
- [ ] Step 5: After edits, confirm with user via attempt_completion, suggest running `npm run dev` and checking localhost:5173 for a table with reversed items.
