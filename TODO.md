## Default Page Setting Implementation - TODO

### Completed: [0/10]

**BACKEND (3 steps):**
- [x] 1. Add `default_page` column to `mst_setting` table (ENUM('POS','Orders') DEFAULT 'POS') [Manual DB migration needed]
- [x] 2. `backend/controllers/settingsController.js` - Added getDefaultPageSettings/getDefaultPage/upsertDefaultPage ✓
- [x] 3. `backend/routes/settingsRoutes.js` - Added /default-page routes ✓

**FRONTEND API & CONTEXT (3 steps):**
- [x] 4. `src/common/api/settings.ts` - Added getDefaultPage/saveDefaultPage ✓
- [x] 5. Created `src/common/context/DefaultPageContext.tsx` ✓
- [x] 6. `src/App.tsx` - Wrapped with DefaultPageProvider ✓

**UI & MENU (2 steps):**
- [ ] 7. `src/views/apps/Settings.tsx` - Add "Default Page" dropdown in General tab
- [ ] 8. `src/Layouts/Menu.tsx` - Filter MENU_ITEMS based on defaultPage context

**ROUTE PROTECTION (1 step):**
- [ ] 9. `src/routes/PrivateRoute.tsx` - Add route guards for /apps/orders & /apps/Tableview

**TESTING (1 step):**
- [ ] 10. Test full flow + Backend restart + Frontend dev server

**FRONTEND API & CONTEXT (3 steps):**
- [ ] 4. `src/common/api/settings.ts` - Add getDefaultPage/saveDefaultPage API calls
- [ ] 5. Create `src/common/context/DefaultPageContext.tsx` - Provider + fetch logic
- [ ] 6. `src/App.tsx` - Wrap app with DefaultPageProvider

**UI & MENU (2 steps):**
- [ ] 7. `src/views/apps/Settings.tsx` - Add "Default Page" dropdown in General tab
- [ ] 8. `src/Layouts/Menu.tsx` - Filter MENU_ITEMS based on defaultPage context

**ROUTE PROTECTION (1 step):**
- [ ] 9. `src/routes/PrivateRoute.tsx` / `src/routes/index.tsx` - Add route guards for /apps/orders & /apps/Tableview

**TESTING (1 step):**
- [ ] 10. Test full flow + Backend restart (`cd backend && npm start`) + Frontend dev server

**Next Step:** Backend DB migration → settingsController → settingsRoutes
