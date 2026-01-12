# TODO: Fix TypeError in AccountNature.tsx

## Tasks
- [x] Change destructuring from `{ session }` to `{ user }` in useAuthContext hook
- [x] Replace all `session` references with `user`
- [x] Replace `session.userId` with `user.id` to match the User type
- [x] Add null checks for user properties to prevent similar errors
- [x] Test the component to ensure the error is resolved
