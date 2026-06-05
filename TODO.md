# TODO - Dynamic Menu & User Permission System

- [ ] Inspect route configuration files (src/routes/Routes.tsx / src/routes/index.tsx) to identify where Protected routes can be applied.
- [ ] Add frontend reusable permission utility (hasPermission + hotel_type aware checks).
- [ ] Update sidebar rendering to be permission + hotel_type based (no hardcoded menu visibility).
- [ ] Implement ProtectedPermissionRoute component (moduleName + requiredAction).
- [ ] Add AccessDenied page (or decide redirect behavior) and wire it into ProtectedPermissionRoute.
- [ ] Apply ProtectedPermissionRoute to all sensitive pages/routes (billing save, edit item, delete bill, reports/admin, etc.).
- [ ] Add backend permission middleware that enforces module/action permissions using mst_user_permissions + hotel_type.
- [ ] Attach backend middleware to sensitive API routes (create/edit/delete/view endpoints).
- [ ] Ensure login permissions are cached (localStorage or context) for session restore.
- [ ] Manual testing:
  - [ ] Unauthorized direct URL access blocked
  - [ ] Sidebar menu filtered by permissions and hotel_type
  - [ ] API requests return 403 when permission missing

