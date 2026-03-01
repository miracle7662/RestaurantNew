# Opening Balance Modal Control - Implementation Plan

## Task
Make opening balance modal appear ONLY when opening_balance is NULL in trn_dayend table, otherwise skip to dashboard.

## Changes Required:

### 1. Backend - Dayendcontroller.js
- [x] Fix the SQL query in `getClosingBalance` function to properly check `curr_date IS NOT NULL`
- [x] Add a new endpoint `checkOpeningBalanceRequired` to check if opening_balance is required

### 2. Backend - DayendRoutes.js
- [x] Add new route for `checkOpeningBalanceRequired`

### 3. Frontend - dayend.ts (API)
- [x] Add new API function `checkOpeningBalanceRequired` for checking opening balance requirement

### 4. Frontend - useLogin.tsx
- [x] Add API call to check if opening_balance is NULL after login
- [x] Only navigate to OpeningBalancePage if opening_balance is NULL

## Implementation Summary:

1. **Backend (`checkOpeningBalanceRequired`)**: 
   - Queries the `trn_dayend` table for the latest record with `curr_date IS NOT NULL`
   - Returns `{ required: true }` if `opening_balance` is NULL
   - Returns `{ required: false }` if opening_balance already has a value

2. **Frontend (Login Flow)**:
   - After successful login, calls `checkOpeningBalanceRequired` API
   - If `required: true` → navigates to `/apps/OpeningBalancePage`
   - If `required: false` → navigates to `/` (dashboard)

## Progress:
- [x] Completed implementation
