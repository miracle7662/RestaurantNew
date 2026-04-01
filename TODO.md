# Fix Backend 'Cannot access app before initialization' Error

## Plan Breakdown

### Step 1: [✅ COMPLETED] Edit main.cjs - Replace require/destructure with child_process.spawn
- ✅ Changed startBackend() to spawn 'node backend/server.js'
- ✅ Added process event handlers & lifecycle management

### Step 2: [✅ COMPLETED] Edit backend/server.js - Add self-start logic
- ✅ Added `if (require.main === module) { startServer(app); }`

### Step 3: [IN PROGRESS] Test
- ✅ Killed node.exe processes (electron.exe not running)
- [PENDING] Restart Electron app (run from VSCode terminal: `npm start` or executable)
- [PENDING] Check console: expect "🚀 Starting backend...", "✅ Backend ready at ..."
- [PENDING] Verify `http://localhost:3001/api/health` → {"status":"OK",...}

### Step 4: [PENDING] Rebuild dist/ for production
- Run `npm run build` or check package.json scripts
- Test packed app

**Progress: 2/4 completed - Test the app now!**

## Next Action
1. Start the Electron app
2. Share console output if backend still fails
3. Backend should now spawn cleanly without ReferenceError
