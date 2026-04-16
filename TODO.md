 # Runtime MySQL Config System - TODO

## Approved Plan Implementation Steps

### 1. Backend Setup (Dynamic Config) ✅
- [x] Create `backend/config/dynamicDb.js` - JSON loader + pool creator
- [x] Update `backend/config/db.js` - support dynamic mode
- [x] Create `backend/configs/db-config.json` - default template
- [x] Create `backend/routes/dbConfigRoutes.js` - test/save APIs
- [x] Update `backend/server.js` - file watcher + pool reload
- [x] Mount new routes in server.js
- [x] Update `backend/routes/configRoutes.js` - add /db-status

### 2. Frontend Component ✅
- [x] Copy NetworkConfig.tsx -> `src/components/Settings/DatabaseConfig.tsx`
- [x] Adapt fields: host, port=3306, user, password, database
- [x] Update test: POST /api/db-config/test
- [x] Update save: POST /api/db-config/save
- [x] Add Database tab to src/views/apps/Settings.tsx

### 3. Testing & Integration ✅
- [x] Fixed DB pool null error in dynamicDb.js
- [x] Test backend APIs with Postman/curl
- [x] Test frontend form + connection
- [x] Verify hot-reload: change JSON -> DB reconnects
- [x] Security: Add basic validation/encryption if needed

**Next:** Start with backend files.

Progress: 0/18 ✅

