import React from 'react';
import { useAuthContext } from '@/common';
import BillPreviewPrint from '@/views/apps/PrintReport/BillPrint';
import { useSocketBillPrint } from '@/hooks/useSocketBillPrint';
import { OutletSettings } from '@/utils/applyOutletSettings';

const SocketBillPrinter: React.FC = () => {
  console.log('🎯 === SOCKET BILL PRINTER MOUNTED ===');
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;
  console.log('🏢 OUTLET ID:', outletId, 'User:', user?.username || 'No user');
  
  const { pendingBills, removeBill } = useSocketBillPrint(outletId);
  console.log('📋 Pending bills count:', pendingBills.length);

  const defaultFormData: OutletSettings = {} as OutletSettings;

  return (
    <>
      {pendingBills.map((bill) => {
        // Map items for bill printing
        const mappedItems = bill.items?.map((item: any) => ({
          id: item.ItemID ?? item.itemId ?? 0,
          name: item.ItemName ?? item.item_name ?? item.name ?? 'Unknown',
          price: Number(item.RuntimeRate ?? item.price ?? 0),
          qty: Number(item.Qty ?? item.qty ?? 0),
          isBilled: 1,
          isNCKOT: 0,
          NCName: '',
          NCPurpose: '',
          item_no: item.item_no ?? undefined,
          txnDetailId: item.TXnDetailID ?? item.txnDetailId ?? undefined,
          variantId: item.VariantID ?? item.variantId ?? undefined,
          variantName: item.VariantName ?? item.variantName ?? undefined,
        })) || [];

        if (mappedItems.length === 0) {
          console.log(`⚠️ No items for BILL #${bill.billNo} → Skipping print`);
          removeBill(bill.txnId);
          return null;
        }

        return (
          <BillPreviewPrint
            key={`bill-${bill.txnId}`}
            show={true}
            autoPrint={true}
            onPrint={() => {
              console.log(`🔥 SOCKET BILL PRINT → #${bill.billNo} | Outlet: ${bill.outletid} | Table: ${bill.table_name}`);
              console.log('📦 Bill Items:', mappedItems.map(i => `${i.name} x${i.qty}`).join(', '));
              removeBill(bill.txnId);
            }}
            onHide={() => removeBill(bill.txnId)}
            onClose={() => removeBill(bill.txnId)}
            items={mappedItems}
            currentKOTNo={Number(bill.billNo) || null}
            selectedTable={bill.table_name ?? bill.tableId?.toString() ?? null}
            activeTab={bill.orderType ?? 'Dine-in'}
            customerName={bill.customerName ?? ''}
            mobileNumber={bill.mobileNo ?? ''}
            user={user}
            formData={defaultFormData}
            selectedOutletId={bill.outletid}
            orderNo={bill.billNo}
            taxCalc={{
              subtotal: bill.amount,
              cgstAmt: 0,
              sgstAmt: 0,
              igstAmt: 0,
              grandTotal: bill.amount
            }}
            taxRates={{
              cgst: 0,
              sgst: 0,
              igst: 0
            }}
          />
        );
      })}
    </>
  );
};

export default SocketBillPrinter;
