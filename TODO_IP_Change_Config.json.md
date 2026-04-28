# TODO: IP Change → New config.json Create / Old Delete

## Plan
- [ ] Step 1: `main.cjs` — Add `delete-config` IPC handler
- [ ] Step 2: `main.cjs` — Update `load-config` to persist auto-detected IP changes back to `config.json`
- [ ] Step 3: `main.cjs` — Fix backend restart in `save-config` (replace broken `backendProcess.kill()`)
- [ ] Step 4: `src/config.ts` — Persist IP changes via `electronAPI.saveConfig()` + add `deleteConfigFile()`
- [ ] Step 5: `backend/config/db.js` — Add `reloadConfig()` to re-read config and recreate MySQL pool
- [ ] Step 6: Test & verify (`npm run dev`)

## Details

### Step 1: Add delete-config IPC handler in main.cjs
```js
ipcMain.handle('delete-config', async () => {
  try {
    const configPath = path.join(app.getPath('userData'), 'config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      return { success: true, deleted: true };
    }
    return { success: true, deleted: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

### Step 2: Update load-config in main.cjs
When auto-detected IP differs from saved IP, write updated config back to disk.

### Step 3: Fix backend restart in main.cjs
The current code references `backendProcess` but backend is `require()`-d. Need to store the server instance and restart properly.

### Step 4: Update src/config.ts
After IP change detection, call `saveConfig()` to persist. Also expose `deleteConfigFile()`.

### Step 5: Add reloadConfig() in backend/config/db.js
Re-read config.json, update env vars, and recreate the MySQL pool.

