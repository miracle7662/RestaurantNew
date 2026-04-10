# Restaurant/HotelAdmin Login Process Analysis & Plan

## Information Gathered
- **Backend**: 
  - Login via POST /auth/login with either {email, password} for SuperAdmin or {username, password} for HotelAdmin.
  - Queries mst_users joined with mst_outlets and msthotelmasters (hotel_name, brand_name, trn_gstno).
  - Supports role_level: 'hotel_admin', 'superadmin'.
  - JWT token with hotelid, outletid, role_level, etc.
  - Routes in authRoutes.js mounted likely at /api/auth.
- **Frontend**:
  - Login.tsx: Toggle between SuperAdmin (email: superadmin@miracle.com, pass: superadmin123) and HotelAdmin (username).
  - Calls api/auth.ts loginUserWithEmail/loginUserWithUsername.
  - useLogin hook (pending content) handles auth state.
- **Current Flow**: Already supports hoteladmin login similarly to restaurant (hotel-based tables). SuperAdmin email-only, HotelAdmin username-only.
- **Demo Credentials**: SuperAdmin ready, but no sample HotelAdmin user mentioned.

## Plan
No major code changes needed – process already works for hoteladmin. Steps:
1. Create sample HotelAdmin user via backend script/DB insert.
2. Test login flow.
3. Update docs/README with credentials.
4. Optional: Enhance UI labels if needed (e.g., 'Restaurant Hotel Admin').

## Dependent Files to be Edited
- None (add new script if needed).
- Update TODO.md after.

## Followup Steps
1. Execute DB insert for sample hoteladmin user.
2. Test login via frontend/backend.
3. Run `npm run dev` or similar to demo.
4. Confirm with user.
