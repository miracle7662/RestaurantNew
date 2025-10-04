# TODO: Implement KOT Details in Handover for Settled Bills

## Tasks
- [x] Update Order interface in Handover.tsx to include revKotNo: string;
- [x] Add RevKOT No column to the orders table in Handover.tsx.
- [x] Modify handoverController.js to aggregate KOT Nos from TAxnTrnbilldetails:
  - KOT No: distinct KOTNo where Qty > 0, joined as string.
  - RevKOT No: distinct KOTNo where Qty < 0, joined as string.
  - NCKOT: distinct KOTNo where isNCKOT = 1, joined as string.
- [x] Update the query to fetch these aggregated values.
- [x] Add NC Name to Order interface and table columns.
- [x] Update handoverController.js to include NCName from TAxnTrnbilldetails.
