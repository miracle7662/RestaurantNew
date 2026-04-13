# MySQL Migration - SQLite to MySQL2 db.prepare() → await db.query()

## 📋 Current Status
✅ **Phase 1 Approved** - Update 5 critical controllers  
⏳ **Step 1:** Create TODO.md **(IN PROGRESS)**

## 📂 Phase 1 Files (5 total)
- [ ] **1. backend/controllers/outletController.js** (Open/Visible - Mixed)
- [ ] **2. backend/controllers/Dayendcontroller.js** (Heavy SQLite)  
- [ ] **3. backend/controllers/mstrestmenuController.js** (Mixed)
- [ ] **4. backend/controllers/menuExportController.js** (Full SQLite)
- [ ] **5. backend/controllers/OutletMenuController.js** (Full SQLite)

## 🔄 Migration Rules
```
db.prepare(sql).all(params)     → await db.query(sql, params)
db.prepare(sql).get(param)      → await db.query(sql, [param])
db.prepare(sql).run(params)     → await db.query(sql, params) 
db.transaction(fn)              → await db.query('START TRANSACTION'); try{fn()}catch{await db.query('ROLLBACK')}
db.exec('BEGIN TRANSACTION')    → await db.query('START TRANSACTION')
db.exec('COMMIT')               → await db.query('COMMIT')
db.exec('ROLLBACK')             → await db.query('ROLLBACK')
```

## ✅ Phase 1 Complete Criteria
```
[X] All 5 files updated
[X] No SQLite patterns remain (search_files verify)
[X] Backend runs: cd backend && node server.js
[X] API tests pass
```

## 🚀 Next Phases
```
Phase 2: Remaining 15 controllers (search_files → batch)
Phase 3: Routes + utils validation
Phase 4: Full test suite + attempt_completion
```

**Progress: 0/5 files complete**

