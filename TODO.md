# TODO: Automatic KOT Printing via Socket.IO

## Backend
- [x] 1. Add socket.io dependency to backend/package.json
- [x] 2. Setup Socket.IO server in backend/server.js
- [x] 3. Emit 'new_kot' event in createKOT controller

## Frontend (Shared)
- [x] 4. Add socket.io-client dependency to root package.json
- [x] 5. Extract KOT HTML generator to src/utils/kotHtmlGenerator.ts
- [x] 6. Refactor KotPrint.tsx to use extracted generator

## Frontend (Socket & Auto-Print)
- [x] 7. Create socket client singleton src/common/api/socketClient.ts
- [x] 8. Create useSocketKOT hook src/hooks/useSocketKOT.ts
- [x] 9. Integrate hook into src/App.tsx
- [x] 10. Update global.d.ts if needed

## Testing & Verification
- [ ] 11. Install dependencies
- [ ] 12. Verify build succeeds

