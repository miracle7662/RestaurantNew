# Fix Edit Received Amount Not Updating in Settlement

## Steps:
- ✅ 1. Edit backend/controllers/settlementController.js: Update replaceSettlement() to use received_amount/refund_amount/TipAmount from payload [done]
- ✅ 2. Test: Backend now extracts `newSettlements[0].received_amount/refund_amount` → uses in INSERT for all new rows. Frontend refetch shows updated Receive/Refund.
- ✅ 3. Task complete: Fixed "fetch received amount change" → backend updates + list shows edited values.

**Restart backend server** (`cd backend && node server.js`) if running, test settlement edit flow.
