# TODO - Fix Settlement Refund Issue

## Issue
When settling a bill with refund (where received amount > bill amount), the refund value is not being inserted into the backend database.

## Root Cause
The frontend settlement data doesn't properly include `received_amount` and `refund_amount` fields when calling the backend API.

## Files to Fix

### 1. Billview.tsx
- Update `handleSettleAndPrint` function to include `received_amount` and `refund_amount` in settlements

### 2. Orders.tsx  
- Update `handleSettleAndPrint` function to include `received_amount` and `refund_amount` in settlements

## Fix Details
In both files, the settlements need to be structured as:
```javascript
{
  PaymentType: modeName,
  Amount: parseFloat(paymentAmounts[modeName]) || 0,
  received_amount: // total amount received from customer
  refund_amount: // change given back to customer (totalReceived - grandTotal)
}
```

