# TODO

## Fix: getPendingOrders JSON parse failure
- [ ] Refactor `exports.getPendingOrders` to stop using `GROUP_CONCAT(json_object(...))` + JSON.parse
- [ ] Instead fetch pending orders and pending detail rows separately, then group in Node by `TxnID`
- [ ] Keep the response shape unchanged (`orders[].items[]`), including `id/txnId/kotNo/orderNo/isBilled/outletid/customer/items/total/type`
- [ ] Smoke test by calling the endpoint for pickup/delivery/takeaway and ensure no parse errors occur

