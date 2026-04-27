# IP Change Save → Login Page Fix

## Steps
- [x] 1. Read relevant files (App.tsx, ConfigScreen.tsx, routes, AuthContext, httpClient)
- [x] 2. Confirm plan with user
- [x] 3. Remove auto-login from ConfigScreen.tsx → always navigate to login after save
- [ ] 4. Test the flow

## Plan
Remove hardcoded superadmin auto-login from `ConfigScreen.tsx`. After save success, set config in localStorage and navigate to `/auth/minimal/login` so user can manually login.

