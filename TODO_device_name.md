# TODO: Add device_name to KOT Save - IMPLEMENTATION PLAN

## Status: ✅ PLAN APPROVED - IN PROGRESS

**Overview:** Add `device_name` to KOT creation payload and save to TAxnTrnbill.device_name column.

## Steps (Completed: ✅ | Pending: ⏳)

### 1. ✅ Update API Types [src/common/api/order.ts]
   - Add `device_name?: string` to `CreateKOTPayload` interface

### 2. ✅ Create Device Detection Hook [src/hooks/useDeviceName.ts]
   - Mobile: `DeviceInfo.getDeviceName()`
   - Desktop: `window.require('os').hostname()`
   - Fallback: 'Unknown Device'

### 3. ⏳ Update Components calling createKOT
   - Find via search_files: `createKOT`
   - Add `device_name` from hook to payload
   - Target: OrderEntry/KOTModal components

### 4. ⏳ Backend Socket Emit (Optional) [TAxnTrnbillControllers.js]
   - Include `device_name` in 'new_kot' socket payload

### 5. ⏳ Test
   - Mobile: Verify DeviceInfo name saved
   - Desktop: Verify hostname saved
   - Check DB: `SELECT TxnID, device_name FROM TAxnTrnbill ORDER BY TxnID DESC LIMIT 5;`

**Current Progress:** [Update after each step]

**Next Action:** Update API types → useDeviceName hook → search for createKOT usage

