# TODO: Create Common API for Account Nature and Account Type

## Task: Create common API service and update components to use it

### Steps:
1. [x] Create `src/common/api/accountNature.ts` - Common API service for Account Nature
2. [x] Create `src/common/api/accountType.ts` - Common API service for Account Type  
3. [x] Update `AccountNature.tsx` to use the common API service
4. [x] Update `AccountType.tsx` to use the common API service

### Information Gathered:
- **AccountNature.tsx** and **AccountType.tsx** originally used direct `fetch` calls with hardcoded URLs (`http://localhost:3001/api`)
- Backend has RESTful endpoints for both (GET, POST, PUT, DELETE)
- HttpClient with interceptors already exists in `src/common/helpers/httpClient.ts`
- Pattern shown in existing services like `markets.ts`

### Files Created:
1. `src/common/api/accountNature.ts` - Service with list, getById, create, update, remove methods
2. `src/common/api/accountType.ts` - Service with list, getById, create, update, remove methods

### Files Updated:
1. `src/views/apps/Masters/RestaurantMasters/AccountNature.tsx` - Now uses AccountNatureService for all API calls
2. `src/views/apps/Masters/RestaurantMasters/AccountType.tsx` - Now uses AccountTypeService and AccountNatureService for all API calls

### Benefits:
- Consistent error handling via HttpClient interceptors
- Cleaner, reusable code
- Easy to maintain and update
- Follows existing codebase patterns
- No more hardcoded URLs

