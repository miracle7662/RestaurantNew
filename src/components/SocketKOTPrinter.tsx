import React from 'react';
import { useAuthContext } from '@/common';
import KotPreviewPrint from '@/views/apps/PrintReport/KotPrint';
import { useSocketPrint } from '@/hooks/useSocketPrint';
import { OutletSettings } from '@/utils/applyOutletSettings';

const SocketKOTPrinter: React.FC = () => {
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;
  const { pendingOrders, removeOrder } = useSocketPrint(outletId);

  const defaultFormData: OutletSettings = {} as OutletSettings;

  return (
    <>
      {pendingOrders.map((order) => {
        // Map backend socket payload items to MenuItem format expected by KotPreviewPrint
        const mappedItems = order.items.map((item: any) => ({
          id: item.ItemID ?? item.itemId ?? 0,
          name: item.ItemName ?? item.item_name ?? item.name ?? 'Unknown',
          price: Number(item.RuntimeRate ?? item.price ?? 0),
          qty: Number(item.Qty ?? item.qty ?? 0),
          isBilled: 0,
          isNCKOT: Number(item.isNCKOT ?? 0),
          NCName: item.NCName ?? '',
          NCPurpose: item.NCPurpose ?? '',
          table_name: order.table_name ?? undefined,
          isNew: true,
          item_no: item.item_no ?? undefined,
          kotNo: order.kotNo,
          txnDetailId: item.TXnDetailID ?? item.txnDetailId ?? undefined,
          variantId: item.VariantID ?? item.variantId ?? undefined,
          variantName: item.VariantName ?? item.variantName ?? undefined,
          order_tag: item.order_tag ?? '',
        }));

        return (
          <KotPreviewPrint
            key={`${order.txnId}-${order.kotNo}`}
            show={true}
            autoPrint={true}
            onHide={() => removeOrder(order.txnId)}
            onClose={() => removeOrder(order.txnId)}
            printItems={mappedItems}
            items={mappedItems}
            currentKOTNo={order.kotNo}
            selectedTable={order.table_name ?? order.tableId?.toString() ?? null}
            activeTab={order.orderType ?? 'Dine-in'}
            customerName={order.customerName ?? ''}
            mobileNumber={order.mobileNo ?? ''}
            user={user}
            formData={defaultFormData}
            reverseQtyMode={false}
            selectedOutletId={order.outletid}
            pax={order.pax ?? undefined}
            kotNote={order.kotNote ?? ''}
            orderNo={order.txnId?.toString() ?? null}
            date={null}
            tableStatus={null}
            selectedWaiter={order.steward ?? ''}
            onPrint={() => {
              console.log(`✅ KOT #${order.kotNo} printed via socket`);
            }}
          />
        );
      })}
    </>
  );
};

export default SocketKOTPrinter;

