# Direct Bill Print Implementation (Orders.tsx F10 Button)
Status: [0/8] In Progress

## Breakdown of Approved Plan

### ✅ 1. Create TODO.md [COMPLETED]
- Track all implementation steps

### 🔄 2. Extract Print Logic from BillPrint.tsx
```
Orders.tsx:
- Copy generateBillContent() HTML template logic  
- Copy handlePrintBill() Electron directPrint() logic
- Adapt for Orders.tsx state (items, taxCalc, customerName, etc.)
```

### 🔄 3. Modify handlePrintBill() in Orders.tsx  
```
Current flow:
F10 → markBillAsBilled() → setShowBillPrintModal(true) ❌

New flow:  
F10 → markBillAsBilled() → generate HTML → directPrint() → refresh ✅
- Remove setShowBillPrintModal(true)
- Add direct print after API success
```

### 🔄 4. Add Required States/Imports
```
Orders.tsx imports:
- BillPrintService.getBillPrinterSettings()
- applyBillSettings() utility
- Electron directPrint API access
```

### 🔄 5. Handle Edge Cases
```
- No printer found → fallback + toast
- Print success → table status red → UI refresh  
- QuickBill tab → list refresh
- Customer data persistence
```

### 🔄 6. Test F10 Keyboard Shortcut
```
- Browser devtools → F10 → Verify direct print (no modal)
- Table status changes to red (status=2)
- Bill history updates
```

### 🔄 7. Optional: Add Direct Print Toggle
```
Outlet setting: direct_bill_print (0=modal, 1=direct)
Fallback to modal if no printer/Electron
```

### 🔄 8. Final Verification & Cleanup
```
- Cross-tab testing (Dine-in, QuickBill, Pickup)
- Error handling (no items, no txnId)
- Performance: <2s print time
```

**Next Step**: Extract print logic → implement handlePrintBill()

