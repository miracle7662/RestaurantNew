# Opening Balance Modal Control - Implementation Plan

## Task
Make opening balance modal appear ONLY when opening_balance is NULL in trn_dayend table, otherwise skip to dashboard.

## Changes Required:

### 1. Backend - Dayendcontroller.js
- [ ] Fix the SQL query in `getClosingBalance` function to properly check `curr_date IS NOT NULL`
- [ ] Add a new endpoint to check if opening_balance is required

### 2. Frontend - useLogin.tsx
- [ ] Add API call to check if opening_balance is NULL
- [ ] Only navigate to OpeningBalancePage if opening_balance is NULL

### 3. Frontend - dayend.ts (API)
- [ ] Add new API function for checking opening balance requirement

## Progress:
- [ ] Started implementation
