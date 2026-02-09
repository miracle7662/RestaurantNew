# Menu API Refactoring Tasks

## Completed
- [x] Create src/services/menu.service.ts with menu-related API methods
- [x] Update imports in Menu.tsx to include menuService
- [x] Replace fetchMenu with menuService.getMenuItems
- [x] Replace fetchMenuItems with menuService.getMenuItems

## In Progress
- [ ] Replace handleToggleStatus API call with menuService.updateMenuItem
- [ ] Replace handleToggleGroupStatus API calls with menuService.updateMenuItem
- [ ] Replace fetchDepartmentsForOutlet with menuService.getDepartments
- [ ] Replace handleSubmit POST/PUT with menuService.createMenuItem/updateMenuItem
- [ ] Replace item details fetch with menuService.getMenuItemDetails

## Testing
- [ ] Test fetching menu items
- [ ] Test adding new item
- [ ] Test editing item
- [ ] Test toggling item status
