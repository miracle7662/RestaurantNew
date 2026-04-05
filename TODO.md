# Credit Settlement Customer Update - TODO Steps

## Overview
✅ **Approved Plan**: UPDATE existing TAxnTrnbill header fields (CustomerName/MobileNo/customerid) with new Credit customer data from SettlementModal. Use new data in TrnSettlement.

## Step 1: ✅ [DONE] settlementController.js edits
- Updated `settleBill`: Extracts Credit customer from settlements[], UPDATES TAxnTrnbill header, uses new data in TrnSettlement INSERT.

## Step 2: Verify TAxnTrnbillControllers.js settleBill
- Ensure settlements[] forwarded correctly (appears OK).

## Step 3: Frontend verification (SettelmentModel.tsx)
- ✅ Confirmed: customerid/mobile/customerName correctly added to Credit settlements.

## Step 4: Test Flow
```
1. Orders.tsx → Print Bill (set initial customer if any)
2. SettlementModal → Select Credit → Add/Fetch new customer
3. Settle → Verify:
   - TAxnTrnbill header UPDATED with new Credit customer
   - TrnSettlement uses new customer data
```

## Step 5: [PENDING] Test/Verify
```
npm run dev (restart backend too)
Test: Dine-in → Add items → Print Bill → SettlementModal (Credit + new customer mobile/name) → Settle
DB Check:
- SELECT * FROM TAxnTrnbill WHERE TxnID=? (customer fields updated?)
- SELECT * FROM TrnSettlement WHERE OrderNo=? (new customer data?)
```

**Status**: Core backend ✅ Frontend ✅ Ready for testing!

**Next**: Test flow → Mark Step 5 ✅ → attempt_completion
