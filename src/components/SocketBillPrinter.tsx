import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthContext } from '@/common';
import BillPreviewPrint from '@/views/apps/PrintReport/BillPrint';
import { useSocketBillPrint, SocketBillPayload } from '@/hooks/useSocketBillPrint';
import OrderService from '@/common/api/order';
import { OutletSettings } from '@/utils/applyOutletSettings';
import useDeviceName from '@/hooks/useDeviceName';

interface EnrichedBill {
  billData: any;
  items: any[];
  taxCalc: {
    subtotal: number;
    TaxableValue?: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    grandTotal: number;
  };
  taxRates: { cgst: number; sgst: number; igst: number };
  currentKOTNos: number[];
  customerName: string;
  mobileNumber: string;
  selectedTable: string | null;
  activeTab: string;
  outletid: number;
}

const SocketBillPrinter: React.FC = () => {
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;
  const { deviceName } = useDeviceName();

  const { pendingBills, removeBill } = useSocketBillPrint(outletId);

  // txnId -> enriched full data (fetched via API, jaisa ModernBill.tsx karta hai)
  const [enrichedMap, setEnrichedMap] = useState<Record<number, EnrichedBill>>({});
  const [fetchingIds, setFetchingIds] = useState<Set<number>>(new Set());

  // 🔥 Track version per txnId — increments each time socket re-emits new_bill for same txnId
  // This forces re-fetch even if item count happens to match.
  const enrichedVersionRef = useRef<Map<number, number>>(new Map());

  // 🔥 Track which txnIds are currently being enriched (to block auto-print)
  const enrichingNowRef = useRef<Set<number>>(new Set());

  const enrichBill = useCallback(async (bill: SocketBillPayload) => {
    const txnId = bill.txnId;
    setFetchingIds((prev) => new Set(prev).add(txnId));
    enrichingNowRef.current = new Set(enrichingNowRef.current).add(txnId);

    console.log(`📦 [SocketBillPrinter] enrichBill START for txnId=${txnId} | billNo=${bill.billNo} | socket items=${bill.items?.length || 0}`);

    try {
      // ✅ Same call jo ModernBill.tsx ke loadTakeawayOrder/printBill mein use hota hai
      // — poora header + phone/gst/fssai/address/CGST/SGST/IGST milega
     const res = await OrderService.getBillById(txnId, user.hotelid);
      const data = res?.data || res;

      if (!data) {
        throw new Error('No data returned for txnId ' + txnId);
      }

      const header = data.header || data;
      const headerAny = header as any;

      // ✅ USE data.details (DB-fetched) as source of truth — these have ALL items (old + new)
      const dbDetails = data.details || [];
      console.log(`📦 [SocketBillPrinter] DB fetched ${dbDetails.length} items for txnId=${txnId}:`,
        dbDetails.map((d: any) => `${d.item_name || d.ItemName || '?'} x${d.Qty || 0}`).join(', ')
      );

      const mappedItems = dbDetails.map((item: any) => {
        // ✅ Net quantity = Qty - RevQty
        const qty = Number(item.Qty ?? 0);
        const revQty = Number(item.RevQty ?? 0);
        const netQty = Math.max(0, qty - revQty);

        return {
          id: item.ItemID ?? item.itemId ?? 0,
          name: item.ItemName ?? item.item_name ?? item.itemName ?? 'Unknown',
          price: Number(item.RuntimeRate ?? item.price ?? item.rate ?? 0),
          qty: netQty,
          isBilled: 1,
          isNCKOT: 0,
          NCName: '',
          NCPurpose: '',
          item_no: (item.item_no ?? '').toString(),
          txnDetailId: item.TXnDetailID ?? item.txnDetailId ?? undefined,
          variantId: item.VariantID ?? item.variantId ?? undefined,
          variantName: item.VariantName ?? item.variantName ?? undefined,
          kotNo: item.KOTNo ?? item.kotNo ?? undefined,
          specialInst: item.SpecialInst ?? '',
          isRuntimeRate: item.isRuntimeRate === 1 || item.isRuntimeRate === true,
        };
      });

      console.log(`📦 [SocketBillPrinter] Mapped ${mappedItems.length} items for txnId=${txnId}:`,
        mappedItems.map((i: any) => `${i.name} x${i.qty}`).join(', ')
      );

      const allKotNos = Array.from(
        new Set(mappedItems.map((i: any) => i.kotNo).filter(Boolean))
      ).sort((a: any, b: any) => a - b) as number[];

      const cgstAmt = Number(header.CGST ?? 0);
      const sgstAmt = Number(header.SGST ?? 0);
      const igstAmt = Number(header.IGST ?? 0);
      const grandTotal = Number(header.Amount ?? bill.amount ?? 0);
      const subtotal = Number(header.GrossAmt ?? headerAny.TaxableValue ?? grandTotal);

      // Update enrichedVersionRef — increment version so re-fetch is always forced
      const prevVer = enrichedVersionRef.current.get(txnId) || 0;
      enrichedVersionRef.current.set(txnId, prevVer + 1);

      setEnrichedMap((prev) => ({
        ...prev,
        [txnId]: {
          billData: data,
          items: mappedItems,
          taxCalc: {
            subtotal,
            TaxableValue: Number(headerAny.TaxableValue ?? subtotal),
            cgstAmt,
            sgstAmt,
            igstAmt,
            grandTotal,
          },
          taxRates: {
            cgst: cgstAmt > 0 && subtotal > 0 ? Number(((cgstAmt / subtotal) * 100).toFixed(2)) : 0,
            sgst: sgstAmt > 0 && subtotal > 0 ? Number(((sgstAmt / subtotal) * 100).toFixed(2)) : 0,
            igst: igstAmt > 0 && subtotal > 0 ? Number(((igstAmt / subtotal) * 100).toFixed(2)) : 0,
          },
          currentKOTNos: allKotNos,
          customerName: header.CustomerName ?? bill.customerName ?? '',
          mobileNumber: header.MobileNo ?? bill.mobileNo ?? '',
          selectedTable: header.table_name ?? bill.table_name ?? bill.tableId?.toString() ?? null,
          activeTab: header.Order_Type ?? bill.orderType ?? 'Dine-in',
          outletid: bill.outletid,
        },
      }));

      console.log(`✅ [SocketBillPrinter] enrichBill DONE for txnId=${txnId} | ${mappedItems.length} items (net)`);
    } catch (err) {
      console.error('❌ Failed to enrich socket bill for txnId', txnId, err);
      // Fallback: minimal data se hi print karo (better than stuck forever)
      setEnrichedMap((prev) => ({
        ...prev,
        [txnId]: {
          billData: { TxnNo: bill.billNo, txnNo: bill.billNo },
          items: bill.items.map((item: any) => ({
            id: item.ItemID ?? item.itemId ?? 0,
            name: item.ItemName ?? item.item_name ?? 'Unknown',
            price: Number(item.RuntimeRate ?? item.price ?? 0),
            qty: Number(item.Qty ?? item.qty ?? 0),
            isBilled: 1,
          })),
          taxCalc: { subtotal: bill.amount, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, grandTotal: bill.amount },
          taxRates: { cgst: 0, sgst: 0, igst: 0 },
          currentKOTNos: [],
          customerName: bill.customerName ?? '',
          mobileNumber: bill.mobileNo ?? '',
          selectedTable: bill.table_name ?? bill.tableId?.toString() ?? null,
          activeTab: bill.orderType ?? 'Dine-in',
          outletid: bill.outletid,
        },
      }));
    } finally {
      setFetchingIds((prev) => {
        const next = new Set(prev);
        next.delete(txnId);
        return next;
      });
      // Remove from enrichingNowRef so auto-print can fire
      const nextEnriching = new Set(enrichingNowRef.current);
      nextEnriching.delete(txnId);
      enrichingNowRef.current = nextEnriching;
    }
  }, []);

  // 🔥 FIXED: Jab bhi naya bill socket se aaye, uska poora data fetch karo
  // Key change: We ALWAYS clear stale enrichedMap entry so re-fetch is forced.
  // Also, we block auto-print via enrichingNowRef until enrichment completes.
  useEffect(() => {
    pendingBills.forEach((bill) => {
      const txnId = bill.txnId;

      // If we already have enriched data for this txnId AND we're NOT currently enriching it,
      // keep it (print-ready). Otherwise, force re-fetch.
      const existing = enrichedMap[txnId];
      const isCurrentlyEnriching = fetchingIds.has(txnId) || enrichingNowRef.current.has(txnId);

      if (!existing) {
        // Brand new bill — fetch
        if (!isCurrentlyEnriching) {
          console.log(`🆕 [SocketBillPrinter] NEW bill txnId=${txnId}, fetching...`);
          enrichBill(bill);
        }
      } else if (isCurrentlyEnriching) {
        // Already being enriched — don't re-trigger, existing data is stale, skip render
        // The auto-print will only fire once enrichment is done (enrichedMap updated)
      } else {
        // We have existing data AND we're NOT enriching.
        // Check if socket payload has more/updated items than our stale data
        const existingItemCount = existing.items?.length || 0;
        const newItemCount = bill.items?.length || 0;

        if (newItemCount !== existingItemCount) {
          // 🔥 Item count changed — clear stale entry + re-fetch
          console.log(`🔄 [SocketBillPrinter] txnId=${txnId} item count changed: ${existingItemCount} → ${newItemCount}, re-fetching...`);
          // Clear stale entry so existing check fails
          setEnrichedMap((prev) => {
            const next = { ...prev };
            delete next[txnId];
            return next;
          });
          enrichBill(bill);
        }
      }
    });
  }, [pendingBills, enrichedMap, fetchingIds, enrichBill]);

  const defaultFormData: OutletSettings = {} as OutletSettings;

  return (
    <>
      {pendingBills.map((bill) => {
        // 🛑 SKIP SELF-PRINT: If the bill was generated from THIS device,
        // don't print again (Billview already handles local printing)
        if (bill.device_name && deviceName && bill.device_name === deviceName) {
          console.log(`⏭️ SKIPPING self-print for bill #${bill.billNo} (device: ${bill.device_name})`);
          removeBill(bill.txnId);
          return null;
        }

        const enriched = enrichedMap[bill.txnId];

        // Jab tak enrich nahi hua, print mount hi mat karo
        // (isse autoPrint incomplete data ke saath fire nahi hoga)
        if (!enriched) return null;

        return (
          <BillPreviewPrint
            key={`bill-${bill.txnId}`}
            show={true}
            autoPrint={true}
            onPrint={() => removeBill(bill.txnId)}
            onHide={() => removeBill(bill.txnId)}
            onClose={() => removeBill(bill.txnId)}
            items={enriched.items}
            billData={enriched.billData}
            currentKOTNos={enriched.currentKOTNos}
            currentKOTNo={enriched.currentKOTNos[0] ?? null}
            selectedTable={enriched.selectedTable}
            activeTab={enriched.activeTab}
            customerName={enriched.customerName}
            mobileNumber={enriched.mobileNumber}
            user={user}
            formData={defaultFormData}
            selectedOutletId={enriched.outletid}
            orderNo={bill.billNo}
            txnNo={bill.billNo}
            taxCalc={enriched.taxCalc}
            taxRates={enriched.taxRates}
          />
        );
      })}
    </>
  );
};

export default SocketBillPrinter;