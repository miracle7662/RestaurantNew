# TODO: Modify fetchPaymentModes in Settelment.tsx

- [x] Modify the fetchPaymentModes function to pass outletid parameter to OutletPaymentModeService.list()
- [x] Add useEffect to call fetchPaymentModes when selectedOutletId changes
- [x] Handle case when selectedOutletId is null by setting outletPaymentModes to empty array
- [ ] Test the changes to ensure payment modes are filtered by selected outlet
