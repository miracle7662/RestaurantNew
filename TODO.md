# Server IP Common API Refactor (Approved Plan)

## Steps:
- [x] 1. Create `src/common/api/server.ts` with `getServerIP()` function using fetch('http://localhost:3001/get-server-ip')
- [x] 2. Update `src/Layouts/Header.tsx`: Replace useEffect fetchServerIP with call to getServerIP()
- [x] 2.1 Updated server.ts to match unitmaster.ts pattern (Service object)

- [x] 3. Verify no errors, IP displays correctly
- [ ] 4. Complete task
