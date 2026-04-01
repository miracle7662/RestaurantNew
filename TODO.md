# Clear Auth on App Close - Implementation Plan

## Status: ✅ Complete

### Step 1: [✅ Complete] Create TODO.md for tracking
### Step 2: [✅ Complete] Edit main.cjs - Add before-quit and window-all-closed handlers
### Step 3: Test in dev mode (`npm run dev-electron`)
### Step 4: Test prod build (`npm run build-electron`)
### Step 5: [Final] Verify login shows on relaunch after quit

**Notes:**
- Clears localStorage/sessionStorage on before-quit
- Kills backendProcess on window-all-closed
- macOS handling preserved

**Updated main.cjs:**
- Added handlers after `app.whenReady()`
- Ready for testing!


