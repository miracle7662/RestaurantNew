# Orders.tsx Settlement Modal Fix - Step-by-Step Plan

## ✅ STATUS: **IN PROGRESS** (0/5 complete)

### **1. [ ] Create TODO.md** ← **DONE**
   - File created with step-by-step plan

### **2. [ ] Remove unused `printThenSettleFlow` state & references**
   - Delete state declaration
   - Remove `setPrintThenSettleFlow(true)` calls  
   - Remove related BillPrintModal props

### **3. [ ] Fix `handlePrintAndSettle()` - Open SettlementModal**
```tsx
// BEFORE  
setPrintThenSettleFlow(true);  ❌ unused  
setShowBillPrintModal(true);  

// AFTER  
setShowBillPrintModal(true);  
setShowSettlementModal(true);  ✅ FIX
```

### **4. [ ] Add useEffect - Auto-select Cash in SettlementModal**
```tsx
useEffect(() => {
  if (showSettlementModal && outletPaymentModes.length > 0) {
    const cashMode = outletPaymentModes.find(m => 
      m.payment_mode_name?.toLowerCase() === 'cash'
    );
    if (cashMode && selectedPaymentModes.length === 0) {
      setSelectedPaymentModes(['cash']);
      setPaymentAmounts({ cash: taxCalc.grandTotal.toFixed(2) });
    }
  }
}, [showSettlementModal, outletPaymentModes, taxCalc.grandTotal]);
```

### **5. [ ] Test Complete F11 Flow** 
```
F11 → BillPrintModal (✅ prints) → SettlementModal (✅ opens + cash auto-selected) 
→ Settle → Success + Tableview ✅
```

### **Expected Result:**
```
❌ BEFORE: F11 → BillPrintModal → DEAD END  
✅ AFTER:  F11 → BillPrint → SettlementModal(💰Cash=₹GrandTotal) → Settle ✅
```

---

**Next Command:** `read_file src/views/apps/Transaction/Orders.tsx` → **analyze for edits**

