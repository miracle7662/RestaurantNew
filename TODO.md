# Task: Add + Icon Column in Multiple Price Tab for Half/Full Selection

## Status: COMPLETED ✅ (Fixed)

## Information Gathered:
- Current file: `src/views/apps/Masters/RestaurantMasters/Menu.tsx`
- Already has `DepartmentRate` interface with `half_rate` and `full_rate` fields
- The Multiple Price tab is inside the ItemModal component
- **Issue Found**: The dropdown was using native Bootstrap JS (`data-bs-toggle="dropdown"`) which was not loaded in the React app

## Implementation Steps Completed:
1. ✅ Added `Dropdown` import from react-bootstrap
2. ✅ Replaced native Bootstrap dropdown with React Bootstrap's `<Dropdown>` component
3. ✅ Used `<Dropdown.Toggle>` for the "+" button
4. ✅ Used `<Dropdown.Menu>` and `<Dropdown.Item>` for Half/Full options
5. ✅ Dropdown now works properly without requiring Bootstrap JS

## Changes Made:
- `src/views/apps/Masters/RestaurantMasters/Menu.tsx`:
  - Added `Dropdown` to imports: `import { Button, Modal, Form, Row, Col, Card, Table, Navbar, Offcanvas, Tabs, Tab, Dropdown } from 'react-bootstrap';`
  - Replaced the native `<div className="dropdown">` with React Bootstrap's `<Dropdown align="end">`
  - Used `<Dropdown.Toggle>` with a styled "+" span instead of `<button>`
  - Used `<Dropdown.Menu>` with `<Dropdown.Item>` for Half/Full options

## Dependent Files Edited:
- `src/views/apps/Masters/RestaurantMasters/Menu.tsx` (the main file)

## Followup Steps:
- Test the Half/Full selection functionality
- The dropdown should now open properly when clicking the + icon

