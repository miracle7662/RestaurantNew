# F8 Password Protection Implementation

## Overview
Implement password protection for F8 key functionality when used on billed tables (isBilled = 1).

## Tasks

### Backend Changes
- [ ] Add `verifyF8Password` endpoint in `authController.js`
- [ ] Add route for password verification in `authRoutes.js`

### Frontend Changes
- [ ] Modify F8 key handler in `Orders.tsx` to check table billing status
- [ ] Add password modal component for F8 action
- [ ] Update F8 logic to call password verification for billed tables

### Integration
- [ ] Check if selected table has `isBilled = 1` before F8 action
- [ ] Show password modal for billed tables
- [ ] Call normal F8 functionality for unbilled tables

## Implementation Details

### Backend
1. **New Endpoint**: `POST /api/auth/verify-f8-password`
   - Input: `{ password: string }`
   - Output: `{ success: boolean, message: string }`
   - Validates password against current user's stored password

### Frontend
1. **F8 Handler Logic**:
   - Check if selected table exists and has `isBilled = 1`
   - If billed: Show password modal
   - If unbilled: Proceed with normal F8 functionality
   - If no table: Show error message

2. **Password Modal**:
   - Simple modal with password input
   - Submit button to verify password
   - Cancel button to close modal
   - Error display for invalid password

## Testing Checklist
- [ ] Test F8 on unbilled table (should work normally)
- [ ] Test F8 on billed table without password (should show modal)
- [ ] Test F8 on billed table with correct password (should proceed)
- [ ] Test F8 on billed table with incorrect password (should show error)
- [ ] Test F8 with no table selected (should show error)
