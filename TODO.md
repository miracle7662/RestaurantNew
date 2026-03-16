## Department Tax Assignment - Implementation Plan

### Status: ✅ **PLAN APPROVED** - Implementing step-by-step

## ⛏️ STEPS (7 Total)

### ✅ **PHASE 1: Backend APIs** (Current)
- [x] 1. Create `backend/controllers/msttaxgroupController.js` (GET list by outlet)
- [x] 2. Update `backend/controllers/msttableDepartmentController.js` (PUT update taxgroupid)  
- [x] 3. Create `backend/routes/msttaxgroupRoutes.js` + register in server.js
- [x] 4. Update `backend/routes/msttableDepartmentRoutes.js` (PUT /:id)

### ✅ **PHASE 2: Frontend Services** [2/2]
- [x] 5. Create `src/common/api/taxgroups.ts` (TaxGroupService) ✅
- [x] 6. `src/common/api/tabledepartment.ts` already has `update()` ✅

### 🎨 **PHASE 3: Settings UI**
- [ ] 7. Update `src/views/apps/Settings.tsx` (+taxgroup dropdown + save form)

### 🧪 **PHASE 4: Test & Migrate**
- [ ] 8. Test: Settings → assign tax → Billview → verify taxes
- [ ] 9. SQL Migration: `UPDATE msttable_department SET taxgroupid=1 WHERE department_name LIKE '%Pickup%'`
- [ ] 10. **COMPLETE** → attempt_completion

## 📋 PROGRESS TRACKER
```
Phase 1: Backend APIs [4/4] ✅
Phase 2: Services     [0/2] 
Phase 3: UI           [0/1]  
Phase 4: Test         [0/2] 
```

**Next Step:** Backend controllers/routes → Mark complete → Phase 2

**ETA:** 20 mins per phase → **~1 hour total**

