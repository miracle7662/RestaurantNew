# TODO: Update outletController.js to consistent response format

## Task
Update all endpoints in outletController.js to follow the format:
```json
{
  success: true,
  message: "...",
  data: {...settings}
}
```

## Endpoints to Update

- [ ] getBrands - returns plain array
- [ ] getOutletsByHotel - returns plain array
- [ ] addOutlet - returns plain object
- [ ] updateOutlet - returns plain object
- [ ] deleteOutlet - returns only message
- [ ] getOutletById - returns plain object
- [ ] updateOutletSettings - change 'settings' to 'data'
- [ ] updateKotPrintSettings - returns plain object
- [ ] updateBillPrintSettings - returns only message
- [ ] updateOnlineOrdersSettings - returns plain object
- [ ] getOutletBillingSettings - returns plain object
- [ ] getBillPreviewSettings - returns plain object
- [ ] getBillPrintSettings - returns plain object
- [ ] getKotPrintSettings - returns plain object
- [ ] getAllTablesWithOutlets - returns plain array

## Completed

- [x] getOutlets - Already correct format
- [x] getOutletSettings - Already correct format
- [x] updateBillPreviewSettings - Already correct format
- [x] updateGeneralSettings - Already correct format

