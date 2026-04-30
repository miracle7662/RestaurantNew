import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentConfig } from '@/config';

export interface SocketBillPayload {
  billNo: string;
  txnId: number;
  outletid: number;
  tableId: number | null;
  table_name: string | null;
  amount: number;
  customerName: string | null;
  mobileNo: string | null;
  items: any[];
  settlement: any[];
  pax: number | null;
  steward: string | null;
  orderType: string | null;
}

export function useSocketBillPrint(outletId: number | null | undefined) {
  console.log('🔌 === useSocketBillPrint HOOK CALLED === OutletID:', outletId);
  const [pendingBills, setPendingBills] = useState<SocketBillPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const removeBill = useCallback((txnId: number) => {
    setPendingBills((prev) => prev.filter((b) => b.txnId !== txnId));
  }, []);

  useEffect(() => {
    console.log('⚙️ useSocketBillPrint useEffect triggered. outletId valid?', !!outletId);
    if (!outletId) {
      console.warn('❌ No outletId - skipping socket connection');
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      console.log('🚀 Starting bill socket connection attempt...');
      try {
        const config = await getCurrentConfig();
        console.log('⚙️ Config loaded for bill:', config ? `${config.serverIP}:${config.port}` : 'NO CONFIG');
        if (!config || !isMounted) {
          console.error('❌ No config or unmounted');
          return;
        }

        const socketUrl = `http://${config.serverIP}:${config.port}`;
        console.log("🌐 Bill Socket URL:", socketUrl);
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('🔌 Bill Socket connected:', socket.id);
          socket.emit('join_outlet', outletId);
        });

        socket.on('new_bill', (data: SocketBillPayload) => {
          console.log('🚨 MOBILE BILL DETECTED →', data.billNo, 'Outlet:', data.outletid, 'Table:', data.table_name);
          console.log('📦 Bill Items:', data.items?.map((i: any) => `${i.item_name || i.ItemName} x${i.Qty || i.qty}`).join(', '));
          setPendingBills((prev) => {
            // Prevent duplicate entries for same txnId
            if (prev.some((b) => b.txnId === data.txnId)) {
              console.warn('⚠️ Duplicate bill ignored:', data.billNo);
              return prev;
            }
            console.log('✅ New bill queued for print:', data.billNo);
            return [...prev, data];
          });
        });

        socket.on('disconnect', (reason: string) => {
          console.log('🔌 Bill Socket disconnected:', reason);
        });

        socket.on('connect_error', (err: Error) => {
          console.error('Bill Socket connection error:', err.message);
        });
      } catch (error) {
        console.error('Failed to initialize bill socket:', error);
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [outletId]);

  return { pendingBills, removeBill };
}
