# Table Name Fix in NC KOT Print - Progress Tracker

## ✅ **Current Status**
- [x] **Plan approved** by user
- [ ] **Step 1**: Create KotPrint.tsx fix
- [ ] **Step 2**: Update Orders.tsx props  
- [ ] **Step 3**: Test all tabs (Dine-in, Quick Bill, Pickup/Delivery)
- [ ] **Step 4**: Verify Billview.tsx inheritance
- [ ] **Step 5**: `attempt_completion`

## 📋 **Remaining Steps**
```
1. Edit src/views/apps/PrintReport/KotPrint.tsx ✅ IN PROGRESS
   - Force tableName display (90% fix)
   
2. Edit src/views/apps/Transaction/Orders.tsx
   - Explicit tableName props
   
3. Test NC KOT print in Orders.tsx (all activeTabs)
   
4. Manual verify: KOTPrintSettings checkboxes
   
5. Confirm Billview.tsx also fixed (same KotPrint component)
   
6. attempt_completion()
```

## 🎯 **Next Action**
**Editing `KotPrint.tsx` now** - primary fix (force table display regardless of settings)

**Est. time**: 2 mins → Test → Next step
