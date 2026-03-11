# TODO - Settlement Validation Changes

## Task: Add validation for received amount >= bill amount in settlement

### Steps:
1. [x] Analyze codebase to understand settlement flow
2. [ ] Add frontend validation in SettelmentModel.tsx
3. [ ] Add backend validation in TAxnTrnbillControllers.js
4. [ ] Test the changes

### Changes Made:

#### Frontend (src/views/apps/Transaction/SettelmentModel.tsx):
- Added validation in handleSettle to check if cashReceived >= grandTotal + tip
- Show error message: "Received amount (300) is less than bill amount (500). Bill cannot be settled."

#### Backend (backend/controllers/TAxnTrnbillControllers.js):
- Added validation in settleBill to check if total received >= bill amount
- Return error if validation fails

### Status: In Progress

