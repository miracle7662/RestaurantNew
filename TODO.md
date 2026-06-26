## TODO

- [ ] Fix TypeScript errors in `src/views/pages/hotel-master/Room/index.tsx`
  - [ ] Remove unsafe `response.message` property usage by casting or using safe fallback strings.
  - [ ] Normalize API room payload(s) to the local `Room` type when setting state (ensure `room_status_id` always exists, derive/lookup when needed).
  - [ ] Fix `status_name` typing by updating the local `Room` type usage/handling.
  - [ ] Re-run TypeScript build/typecheck to confirm errors are resolved.

