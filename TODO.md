# TODO: Implement Per-Department Tax Group Feature

## Task: Add taxgroupid to department details in Multiple Price section

### Plan:
1. [x] **Frontend - Update DepartmentRate interface**: Add `taxgroupid` property
2. [x] **Frontend - Update initial department rates**: Include `taxgroupid` when fetching existing details
3. [x] **Frontend - Update Tax Group dropdown**: Connect to state to save selected value per department
4. [x] **Frontend - Update payload**: Pass `taxgroupid` in department_details array
5. [ ] **Backend - Update create query**: Add `taxgroupid` to INSERT for mstrestmenudetails
6. [ ] **Backend - Update update query**: Add `taxgroupid` to INSERT when updating details

### Status: Backend in Progress

