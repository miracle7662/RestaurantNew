# Handover Payment Mode Fix - TODO (pickup/delivery/quickbill)

## Progress: 3/6 ✅

### 1. ✅ Create TODO.md 
### 2. ✅ Verified: TrnSettlement.OrderNo = bill.orderNo (numeric for pickup), TxnNo = null
### 3. ✅ FIXED handoverController.js: WHERE s.OrderNo = t.TxnNo → (s.OrderNo = t.TxnNo OR s.OrderNo = t.orderNo)
### 4. 🔄 TESTING backend /handover/data endpoint  
### 5. ☐ Restart dev server & verify Handover page
### 6. ✅ COMPLETE
