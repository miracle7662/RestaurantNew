import React from 'react';
import { useAuthContext } from '@/common';
import KotPreviewPrint from '@/views/apps/PrintReport/KotPrint';
import { useSocketPrint } from '@/hooks/useSocketPrint';
import useDeviceName from '@/hooks/useDeviceName';
import { OutletSettings } from '@/utils/applyOutletSettings';

const SocketKOTPrinter: React.FC = () => {
  console.log('🎯 === SOCKET KOT PRINTER MOUNTED ===');
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;
  console.log('🏢 OUTLET ID:', outletId, 'User:', user?.username || 'No user');
  const { pendingOrders, removeOrder } = useSocketPrint(outletId);
  const { deviceName } = useDeviceName();
  console.log('📋 Pending orders count:', pendingOrders.length, '| Device:', deviceName);

  const defaultFormData: OutletSettings = {} as OutletSettings;

  return (
    <>
      {pendingOrders.map((order) => {
        // 🛑 SKIP SELF-PRINT: If the KOT was generated from THIS device,
        // don't print again (Billview already handles local printing)
        if (order.device_name && deviceName && order.device_name === deviceName) {
          console.log(`⏭️ SKIPPING self-print for KOT #${order.kotNo} (device: ${order.device_name})`);
          removeOrder(order.txnId);
          return null;
        }
        // Filter ONLY NEW items
        const newItemsOnly = order.items.filter((item: any) => item.isNewItem);
        console.log(`🔍 SOCKET KOT #${order.kotNo}: ${order.items.length} total → ${newItemsOnly.length} NEW only`);

        const mappedItems = newItemsOnly.map((item: any) => ({
          id: item.ItemID ?? item.itemId ?? 0,
          name: item.ItemName ?? item.item_name ?? item.name ?? 'Unknown',
          price: Number(item.RuntimeRate ?? item.price ?? 0),
          qty: Number(item.Qty ?? item.qty ?? 0),
          isBilled: 0,
          isNCKOT: Number(item.isNCKOT ?? 0),
          NCName: item.NCName ?? '',
          NCPurpose: item.NCPurpose ?? '',
          table_name: order.table_name ?? undefined,
          isNew: item.isNewItem ?? true,
          item_no: item.item_no ?? undefined,
          kotNo: order.kotNo,
          txnDetailId: item.TXnDetailID ?? item.txnDetailId ?? undefined,
          variantId: item.VariantID ?? item.variantId ?? undefined,
          variantName: item.VariantName ?? item.variantName ?? undefined,
          order_tag: item.order_tag ?? '',
        }));

        if (mappedItems.length === 0) {
          console.log(`⚠️ No new items for KOT #${order.kotNo} → Skipping print`);
          removeOrder(order.txnId);
          return null;
        }

        // ✅ FIX 1: Normalize activeTab to match KotPreviewPrint expectations
        const normalizedActiveTab =
          order.orderType === 'DineIn' ? 'Dine-in' :
          order.orderType === 'Pickup' ? 'Pickup' :
          order.orderType === 'Delivery' ? 'Delivery' :
          order.orderType === 'Quick Bill' ? 'Quick Bill' :
          'Dine-in'; // fallback

        // ✅ FIX 2: Compute effective table name with fallback from items
        const effectiveTableName =
          order.table_name ??
          (mappedItems.length > 0 ? mappedItems[0].table_name : null) ??
          order.tableId?.toString() ??
          null;

        return (
          <KotPreviewPrint
            key={`${order.txnId}-${order.kotNo}-${mappedItems.length}`}
            show={true}
            autoPrint={true}
            onPrint={() => {
              console.log(`🔥 SOCKET KOT PRINT → #${order.kotNo} | Outlet: ${order.outletid} | Table: ${order.table_name}`);
              console.log('📦 Items:', mappedItems.map(i => `${i.name} x${i.qty}`).join(', '));
              removeOrder(order.txnId);
            }}
            onHide={() => removeOrder(order.txnId)}
            onClose={() => removeOrder(order.txnId)}
            printItems={mappedItems}
            items={mappedItems}
            currentKOTNo={order.kotNo}
            selectedTable={effectiveTableName}
            activeTab={normalizedActiveTab}  // ✅ Fixed
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
          />
        );
      })}
    </>
  );
};

export default SocketKOTPrinter;