# IP Detection on App Startup — Implementation Steps

- [x] 1. Understand project structure and current config flow
- [x] 2. Add `get-system-ipv4` IPC handler in `main.cjs`
- [x] 3. Expose `getSystemIPv4` in `preload.js`
- [x] 4. Add IP comparison helper in `src/config.ts`
- [x] 5. Update `src/App.tsx` startup logic to compare IPs and show ConfigScreen on mismatch
- [x] 6. Enhance `ConfigScreen.tsx` to show IP mismatch warning banner
- [ ] 7. Test and verify

