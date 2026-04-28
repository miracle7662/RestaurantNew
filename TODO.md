# Fix 500 Error + config.json IP Display

## Steps
- [ ] Step 1: `main.cjs` — persist auto-detected IP to config.json; fix backend restart
- [ ] Step 2: `src/common/helpers/httpClient.ts` — use localStorage config for Electron, don't hardcode localhost
- [ ] Step 3: `src/common/api/server.ts` — remove hardcoded BASE_URL, use dynamic config
- [ ] Step 4: `src/config.ts` — persist IP changes by calling saveConfig after load
- [ ] Step 5: `backend/config/db.js` — add pool error handler for diagnostics
- [ ] Step 6: `backend/controllers/authController.js` — more specific DB error messages
- [ ] Step 7: Test & verify

## Details

### Step 1: main.cjs
- In `load-config` handler: write auto-detected IP back to config.json when it changes
- In `save-config` handler: clear Node.js require cache before re-requiring server.js so backend actually restarts with new DB env vars
- Remove dead `backendProcess` references

### Step 2: httpClient.ts
- For Electron (`file://`), read `posServerConfig` from localStorage first
- Only fallback to `localhost:3001` if no config found

### Step 3: server.ts
- Remove `const BASE_URL = 'http://localhost:3001'`
- Build BASE_URL from localStorage config or electronAPI.loadConfig()

### Step 4: config.ts
- After `loadConfig()` detects IP change, call `saveConfig()` via electronAPI to persist

### Step 5: backend/config/db.js
- Add `pool.on('error', ...)` handler for connection diagnostics

### Step 6: backend/controllers/authController.js
- In login catch block, check if error is DB-related and return specific message
