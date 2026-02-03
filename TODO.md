# TODO: Kitchen Allocation (Item Consumption) Report

## Tasks
- [x] Modify backend controller to group by item only (item_no, item_name)
- [x] Remove filters for user and department from backend and frontend
- [x] Update frontend to show item-wise total consumption
- [x] Ensure report sums quantities per item, ignoring bill/transaction ID, user/waiter, table/order type
- [x] Fix SQL query error: RangeError: The supplied SQL string contains more than one statement

## Printing Enhancement Tasks
- [x] Add state for printer settings (paperSize)
- [x] Fetch report printer settings on component mount using outlet_id
- [x] Create dynamic print styles for thermal printer (80mm default)
- [x] Add <style> tag to inject print styles in JSX
- [x] Adjust table layout for narrow thermal printing
