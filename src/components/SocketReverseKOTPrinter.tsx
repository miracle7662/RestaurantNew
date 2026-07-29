import React from 'react';
import { useAuthContext } from '@/common';
import ReverseKotPrint from '@/views/apps/PrintReport/ReverseKotPrint';
import { useSocketReverseKOTPrint } from '@/hooks/useSocketReverseKOTPrint';
import useDeviceName from '@/hooks/useDeviceName';

const SocketReverseKOTPrinter: React.FC = () => {
  console.log('[SocketReverseKOTPrinter] render/mount');
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;

  const { pendingReverseKOTs, removeReverseKOT } = useSocketReverseKOTPrint(outletId);
  const { deviceName } = useDeviceName(); // local device name

  return (
    <>
      {pendingReverseKOTs.map((kot) => {
        // --- Skip self-print ---
        if (kot.device_name && deviceName && kot.device_name === deviceName) {
          console.log(`⏭️ SKIPPING self-print for Reverse KOT #${kot.revKotNo} (device: ${kot.device_name})`);
          removeReverseKOT(kot.txnId, kot.revKotNo);
          return null;
        }
        // -----------------------

        const items = (kot.items || []).map((item: any) => ({
          id: item.ItemID ?? item.itemId ?? 0,
          name: item.ItemName ?? item.item_name ?? item.name ?? 'Unknown',
          qty: Number(item.Qty ?? item.qty ?? 0),
          revQty: Number(item.Qty ?? item.qty ?? 0),
          price: Number(item.RuntimeRate ?? item.price ?? 0),
          isReverse: true,
          revKotNo: kot.revKotNo,
          reason: item.reason ?? kot.reason ?? '',
        }));

        console.log('[SocketReverseKOTPrinter] reverse_kot received:', {
          txnId: kot.txnId,
          revKotNo: kot.revKotNo,
          tableId: kot.tableId,
          table_name: kot.table_name,
          device_name: kot.device_name,
          itemsRawLen: kot.items?.length ?? 0,
          itemsMappedLen: items.length,
          itemsMapped: items.map(i => ({ name: i.name, qty: i.qty, reason: i.reason })).slice(0, 10),
        });

        if (items.length === 0) {
          removeReverseKOT(kot.txnId, kot.revKotNo);
          return null;
        }

        return (
          <ReverseKotPrint
            key={`reverse-kot-${kot.txnId}-${kot.revKotNo}`}
            show={true}
            autoPrint={true}
            onHide={() => removeReverseKOT(kot.txnId, kot.revKotNo)}
            items={items}
            user={user}
            selectedWaiter={''}
            selectedTable={kot.table_name ? String(kot.table_name) : null}
            reversePrintTrigger={kot.revKotNo}
            // Optionally pass deviceName to the print component if needed:
            // printerDeviceName={deviceName}
          />
        );
      })}
    </>
  );
};

export default SocketReverseKOTPrinter;