# TODO List - Fix TypeScript Errors in Settings.tsx

## Task: Fix "'response' is of type 'unknown'" TypeScript errors

### Steps:
- [x] 1. Analyze the issue - API methods in settings.ts don't specify return types
- [x] 2. Confirm the plan with user
- [ ] 3. Update src/common/api/settings.ts with proper return types
- [ ] 4. Verify the fix resolves the TypeScript errors

### Details:
The issue is that HttpClient methods return `Promise<unknown>` when no type is specified.
The fix is to add generic type parameters to all API methods in settings.ts.

Methods to fix:
- listKotPrinters: HttpClient.get<KotPrinterPayload[]>
- listBillPrinters: HttpClient.get<BillPrinterPayload[]>
- listLabelPrinters: HttpClient.get<LabelPrinterPayload[]>
- listReportPrinters: HttpClient.get<ReportPrinterPayload[]>
- listDepartmentPrinters: HttpClient.get<DepartmentPrinterPayload[]>
- listTableWiseKot: HttpClient.get<TableWiseKotPayload[]>
- listTableWiseBill: HttpClient.get<TableWiseBillPayload[]>
- listCategoryPrinters: HttpClient.get<CategoryPrinterPayload[]>
- listKdsUsers: HttpClient.get<KDSUserPayload[]>
