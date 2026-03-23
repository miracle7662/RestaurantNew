# Restaurant POS - Task Tracker

## ✅ Completed Tasks

**Reverse KOT Amount Display**  
- [x] Fixed amount=0 issue in ReverseKotPrint.tsx  
- [x] Added Rate | Qty(-X) | Amount columns + Total  
- [x] Price normalization in Orders.tsx snapshot  

## 🔄 Active Tasks

**NC KOT Print Enhancement** ✅ COMPLETED  
- [✅] Update NcKotPrint.tsx table: Item | Rate | Qty | Amount + Total footer  
- [✅] Fix Orders.tsx ncPrintItems price normalization  
- [✅] Test NC KOT flow end-to-end  

## 📋 Pending Tasks

1. **Refactor Orders.tsx** (~5000 lines → Extract:  
   - Custom hooks: `useTableManagement`, `useOrderCalculations`, `usePrintHandlers`  
   - Utils: `tableStatusColor`, `kotPayloadBuilder`  

2. **BillPrint.tsx** - Similar enhancements (Rate/Amount columns if needed)  

3. **PrintReport Consistency**  
   - Shared `PrintModal` HOC  
   - Centralized printer settings  

4. **Performance**  
   - Memoize large item lists  
   - Virtualize table buttons  

## Next Steps  
```
- ✅ Complete NC KOT edits  
- 📝 Update this TODO after each step  
```

