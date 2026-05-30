import React from 'react';
import { useAuthContext } from '@/common';
import ReverseKotPrint from '@/views/apps/PrintReport/ReverseKotPrint';
import { useSocketReverseKOTPrint } from '@/hooks/useSocketReverseKOTPrint';

const SocketReverseKOTPrinter: React.FC = () => {
  const { user } = useAuthContext();
  const outletId = user?.outletid ?? null;

  const { pendingReverseKOTs, removeReverseKOT } = useSocketReverseKOTPrint(outletId);

  return (
    <>
      {pendingReverseKOTs.map((kot) => {
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
            selectedTable={kot.tableId ? String(kot.tableId) : null}
            reversePrintTrigger={kot.revKotNo}
          />
        );
      })}
    </>
  );
};

export default SocketReverseKOTPrinter;

