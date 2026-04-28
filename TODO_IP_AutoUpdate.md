# TODO: Auto-update config.json when machine IP changes

## Plan
1. **main.cjs** — Add new IPC handler `update-config-ip` that reads existing config.json, patches `serverIP` and `dbHost`, writes back without restarting backend.
2. **preload.js** — Expose `electronAPI.updateConfigIP({ serverIP, dbHost })` channel.
3. **src/global.d.ts** — Add `updateConfigIP` method signature to Window.electronAPI interface.
4. **src/config.ts** — In `loadConfig`, after detecting IP change, call `window.electronAPI.updateConfigIP(...)` to persist new IP to config.json.

## Files to Edit
- [ ] main.cjs
- [ ] preload.js
- [ ] src/global.d.ts
- [ ] src/config.ts

