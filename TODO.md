# TODO: Menu Import/Export Feature

## Plan Overview
Add menu import and export functionality to the Menu page to allow users to bulk manage menu items.

## Backend Tasks
- [ ] 1. Create export API endpoint for menu items (Excel/CSV)
- [ ] 2. Create import API endpoint for menu items (Excel)
- [ ] 3. Add route for export/import in backend routes
- [ ] 4. Test backend API endpoints

## Frontend Tasks
- [ ] 1. Add exportMenu and importMenu API methods in menu.ts service
- [ ] 2. Add Import modal component in Menu.tsx
- [ ] 3. Add Export/Import buttons in Menu page header
- [ ] 4. Implement file upload and parsing logic
- [ ] 5. Test the complete flow

## Implementation Details

### Backend:
- Export: GET /menu/export?hotelid=X&outletid=Y - returns Excel file
- Import: POST /menu/import - accepts Excel file with menu items

### Frontend:
- Export button: Downloads current menu items as Excel
- Import button: Opens modal to upload Excel file
- Import Modal: Shows preview and confirm import options

