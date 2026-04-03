# Fix User Creation 404 Error in Brand.tsx

## Task: Resolve POST http://localhost:3001/api/api/users 404 (double /api/)

### Plan Approved:
- **Primary Fix**: Update `src/common/api/brand.ts` - Change `BrandService.createUser('/api/users')` → `'/users'`
- **Backend**: Confirmed `/api/users` endpoint working
- **Verification**: Test user creation modal in Brand.tsx

### Steps:
- [ ] 1. Edit `src/common/api/brand.ts` (remove `/api` from users endpoint)
- [ ] 2. Test user creation in Brand.tsx (RegisterUserModal & AddUserModal)
- [ ] 3. Verify Network tab: Request should hit `http://localhost:3001/api/users`
- [ ] 4. Mark complete & attempt_completion

**Current Step: 1/4**

