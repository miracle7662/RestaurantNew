# Task: Add Department Tax Settings for Pickup/Delivery/Quick Bill in Settings General Tab

Status: ✅ In Progress

## Steps:

### 1. [✅ COMPLETE] Create this TODO.md file

### 2. [✅ COMPLETE] Update src/views/apps/Settings.tsx
   - [✅] Added states
   - [✅] Added fetchDepartments(), fetchGeneralSettings(), handleSaveGeneralSettings()
   - [✅] Added General tab JSX with selectors and table

### 3. [ ] Backend Database
   - Create table `order_type_departments` (outletid, order_type, departmentid, created_at)
   - Add migration script if needed

### 4. [ ] Backend Controller & Routes
   - settingsController.js: listOrderTypeDepartments, createOrderTypeDepartment
   - settingsRoutes.js: routes for endpoints

### 5. [ ] Frontend API Service
   - src/common/api/settings.ts: add getOrderTypeDepartments, saveOrderTypeDepartment

### 6. [ ] Integration
   - Update Billview.tsx/Orders.tsx to use settings for default department/tax

### 7. [ ] Testing
   - Test UI save/fetch
   - Test ordering flow tax calculation
   - [ ] attempt_completion

Next: Update Settings.tsx General tab UI.

