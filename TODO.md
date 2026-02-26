# API Files Conversion Task

## Target Format: order.ts format
- Use HttpClient from '../helpers/httpClient'
- Use ApiResponse from '@/types/api'
- Add comprehensive type definitions
- Use const Service pattern with Promise<ApiResponse<T>> return types

## Files to Convert (25 total)

### Using `function Service()` pattern (21 files):
- [x] cities.ts
- [x] countries.ts
- [x] hotels.ts
- [x] hoteltype.ts
- [x] itemgroup.ts
- [x] itemmaingroup.ts
- [x] kitchencategory.ts
- [x] kitchenmaingroup.ts
- [x] kitchensubcategory.ts
- [x] markets.ts
- [x] menu.ts
- [x] outletdesignation.ts
- [x] outletpaymentmode.ts
- [x] profile.ts
- [x] resttaxmaster.ts
- [x] settlements.ts
- [x] states.ts
- [x] taxgroups.ts
- [x] unitmaster.ts
- [x] usertype.ts
- [x] warehouses.ts

### Using `new APICore()` pattern (4 files):
- [x] brand.ts
- [x] masterData.ts
- [x] outlet.ts
- [x] outletUser.ts

## Summary
All 25 API files have been successfully converted to the order.ts format!
