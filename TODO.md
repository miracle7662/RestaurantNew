# TODO List for Settlement Page Outlet-Based Payment Modes

- [x] Add selectedOutletId state to Settlement.tsx
- [x] Add outletId and hotelId to filters
- [x] Add outletId and hotelId filter inputs to the UI
- [x] Update fetchData to include outletId in params
- [x] Add useEffect to sync selectedOutletId with filters.outletId
- [x] Replace global payment modes fetch with outlet-specific fetch using the provided useEffect
- [x] Update edit modal to use outletPaymentModes instead of paymentModes
