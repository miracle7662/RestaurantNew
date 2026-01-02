# Implement KOT Handling in Billview.tsx

## Plan Steps
1. Add viewMode state ('list' or 'group'), default 'list'.
2. Add toggle button in header for List/Group View.
3. Modify saveKOT: Loop through valid items, call API for each separately to create individual KOTs, update mkotNo.
4. Add groupedItems computation for Group View (group by item_id, sum qty).
5. Modify table rendering: Use billItems for list, groupedItems for group.
6. Add expandable rows in Group View to show KOT details.
7. Ensure fetching handles flat KOT-wise items (already done).
8. Test saving multiple items (separate KOTs), test UI grouping and toggle.
