# Credit Settlement Feature - Test Verification TODO

## Status: ✅ Plan Approved - Testing Phase

### Step 1: Environment Setup [✅]
- [✅] Frontend: npm run dev (localhost:5174)
- [🔄] Backend: Restart after fix (`cd backend && npm start`)
- [✅] DB: TrnSettlement schema confirmed

### Step 2: Create Test Customer [PENDING]
- [ ] Add sample customer via Customers modal or direct DB
- [ ] Verify GET /customers/by-mobile?mobile=XXXXXXXXXX returns data

### Step 3: Test Credit Flow [PENDING]
- [ ] Create bill/table order
- [ ] Open SettlementModal → Select Credit
- [ ] Enter mobile → Verify auto-fetch customerName/ID
- [ ] \"Add New\" works (if needed)
- [ ] Validation blocks non-verified customer
- [ ] Settle → Success toast + print

### Step 4: Backend/DB Verification [PENDING]
\`\`\`sql
SELECT OrderNo, PaymentType, customerid, CustomerName, MobileNo 
FROM TrnSettlement 
WHERE LOWER(PaymentType) LIKE '\%credit\%';
\`\`\`
- [ ] Query shows inserted Credit record with customer data
- [ ] Fields populated: customerid, CustomerName, MobileNo

### Step 5: Edge Cases [PENDING]
- [ ] Invalid mobile → \"Customer not found\" + block settle
- [ ] Deselect Credit → Customer fields hide/reset
- [ ] Mixed payment with Credit → Only Credit requires customer

### Step 7: Backend Bug Fix [✅]
- [✅] settlementController.js: Parse Credit customer data from payload
- [ ] Restart backend → Test insert

### Step 6: Completion [PENDING]
- [ ] All tests PASS → Update TODO.md ✅
- [ ] attempt_completion with demo commands


