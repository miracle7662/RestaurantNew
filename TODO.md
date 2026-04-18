# ConfigScreen Not Opening Fix - TODO

## Status: 🔄 In Progress (0/5 complete)

### Plan Breakdown:
1. [✅] **Add `has-config-file` IPC handler to main.cjs** - Check if config.json exists at app.getPath('userData')
2. [✅] **Expose `hasConfigFile` in preload.js** - Add to electronAPI object
3. [✅] **Update src/App.tsx useEffect logic** - Check `electronAPI.hasConfigFile()` to set `showConfigFirst`
4. [ ] **Test first-run behavior** - Delete config.json → restart → ConfigScreen shows
5. [ ] **Test configured behavior** - Save config → restart → skips to dashboard

## Status: ✅ 2/5 complete

## Next Step: Implement IPC handlers (main.cjs → preload.js → App.tsx)

**Commands to test:**
```bash
# Delete config for first-run test
rmdir /s "C:\Users\Sharmin\AppData\Roaming\miracle-restaurant"
# OR manually delete config.json there, then npm run dev/electron
```

