# Fix IP Auto-Detection & 500 Login Error

## Steps
- [ ] Step 1: Fix `main.cjs` - Fix undefined `restartBackendWithConfig`, implement proper backend restart with cache clearing and old server stop
- [ ] Step 2: Fix `main.cjs` - Update `load-config` to persist auto-detected IP changes back to `config.json`
- [ ] Step 3: Fix `main.cjs` - Fix `backendProcess` vs `backendServer` mismatch in `window-all-closed`
- [ ] Step 4: Fix `src/config.ts` - Persist auto-detected IP changes back to `config.json` via `electronAPI.saveConfig()`
- [ ] Step 5: Fix `backend/config/db.js` - Add `reloadConfig()` function to re-read config and recreate pool
- [ ] Step 6: Update `TODO_IP_AutoDetect.md` - Mark completion and document fixes
- [ ] Step 7: Test and verify

