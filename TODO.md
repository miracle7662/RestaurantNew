# TODO: Integrate updateTakeawaySetting in Settings.tsx (Only UPDATE, no CREATE)

## Steps:
- [x] 1. Add `settingId` state in src/views/apps/Settings.tsx
- [x] 2. Update `fetchTakeawaySetting` useEffect to capture `settingId` from response
- [x] 3. Modify dropdown `onChange` to use `updateTakeawaySetting(PUT)` if `settingId` exists, fallback to `saveTakeawaySetting(POST)`
- [ ] 4. Test: Change dropdown → verify PUT request with `settingid`, no INSERT
- [ ] 5. Complete task

**Status:** Starting implementation...

