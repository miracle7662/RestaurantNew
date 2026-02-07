# City Module Refactor TODO

## Steps to Complete
- [x] Create `src/common/api/cities.ts` with API service functions using httpClient
- [x] Create `src/views/apps/Masters/CommanMasters/index.tsx` for listing logic
- [x] Create `src/views/apps/Masters/CommanMasters/CityForm.tsx` with Formik + Yup
- [x] Update `src/common/api/index.ts` to export cities functions
- [x] Verify no direct fetch/axios in components, all via cities.ts and httpClient
- [x] Test functionality and ensure production-ready code
