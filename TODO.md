# TODO - DayEnd dynamic payment mode columns

## Step 1
- [ ] Update `src/views/apps/Transaction/DayEnd.tsx` to fetch outlet payment modes using `OutletPaymentModeService.list({ outletid })`.

## Step 2
- [ ] Add state `paymentModeColumns` (ordered by `sequence` / backend order).

## Step 3
- [ ] Replace hardcoded DayEnd table header payment columns (Cash/Credit/Card/GPay/PhonePe/QR Code) with dynamic headers from `paymentModeColumns`.

## Step 4
- [ ] Render each row’s payment values dynamically by mapping `mode_name` → existing `order.cash/card/credit/gpay/phonepe/qrcode`.

## Step 5
- [ ] Update table footer totals dynamically per payment column.

## Step 6
- [ ] Ensure rest of DayEnd functionality remains unchanged.

## Step 7
- [ ] Run `npm run build` or `npm run lint` (as available) to confirm no TS errors.

