# Role-Based Menu Implementation Plan

Current progress: [x] 25% complete

## Steps:
- [x] Step 1: Update src/common/menu/index.ts - Extract role-based menus and add getRoleBasedMenuItems(role, uiMode) function.
- [x] Step 2: Update src/Layouts/Navigation.tsx - Import useUser, get role_level, use new role-based menu filter.
- [ ] Step 3: Test login as outlet_user and hotel_admin to verify menus.
- [ ] Step 4: Run npm run dev, verify no errors.

**Details:** 
- Roles: 'outlet_user' shows POS/Orders/Settlement.../Logout.
- 'hotel_admin' shows HotelAdmin/Brand/HotelConfigration/Masters etc.
- Preserve uiMode filter (POS/Tableview toggle).

