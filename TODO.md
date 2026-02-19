# TODO - OpeningBalanceModal after Login

## Task:
1. After login success, open OpeningBalanceModal
2. After submitting in OpeningBalanceModal, navigate to / (Dashboard)

## Implementation Plan:

### Step 1: Update Login.tsx
- [ ] Add state to track OpeningBalanceModal visibility
- [ ] Show OpeningBalanceModal after successful login (when isAuthenticated is true)
- [ ] Handle modal submission to navigate to dashboard

### Step 2: Update useLogin.tsx (if needed)
- [ ] Adjust login logic to work with the modal flow
