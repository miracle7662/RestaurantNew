# TODO - Fix TypeScript Errors in AddOutlet.tsx

## Task Summary
Fix TypeScript errors in AddOutlet.tsx where payloads being passed to service methods have type mismatches (numbers instead of booleans).

## Errors to Fix
1. Line 1045: `show_upi_qr` - number not assignable to boolean (BillPreviewSettings)
2. Line 1046: `customer_on_kot_dine_in` - number not assignable to boolean (KotPrintSettings)
3. Line 1047: `bill_title_dine_in` - number not assignable to boolean (BillPrintSettings)
4. Line 1048: Missing `customize_url_links` and `customer_display` in GeneralSettings
5. Line 1049: `show_in_preparation_kds` - number not assignable to boolean (OnlineOrdersSettings)

## Plan
- [x] Analyze the code and understand the type definitions
- [ ] Fix billPreviewPayload - use boolean instead of number (0/1)
- [ ] Fix kotPrintPayload - use boolean instead of number (0/1)
- [ ] Fix billPrintPayload - use boolean instead of number (0/1)
- [ ] Fix generalPayload - add missing properties and use boolean
- [ ] Fix onlineOrdersPayload - use boolean instead of number (0/1)

## Status: In Progress

