import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentConfig } from '@/config';

export interface SocketOrderPayload {
  kotNo: number;
  outletid: number;
  tableId: number | null;
  table_name: string | null;
  items: any[];
  header: any;
  steward: string | null;
  orderType: string;
  kotNote: string;
  pax: number | null;
  customerName: string | null;
  mobileNo: string | null;
  txnId: number;
}

export function useSocketPrint(outletId: number | null | undefined) {
  console.log('🔌 === useSocketPrint HOOK CALLED === OutletID:', outletId);
  const [pendingOrders, setPendingOrders] = useState<SocketOrderPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const removeOrder = useCallback((txnId: number) => {
    setPendingOrders((prev) => prev.filter((o) => o.txnId !== txnId));
  }, []);

  useEffect(() => {
    console.log('⚙️ useEffect triggered. outletId valid?', !!outletId);
    if (!outletId) {
      console.warn('❌ No outletId - skipping socket connection');
      return;
    }

    let isMounted = true;

    const connectSocket = async () => {
      console.log('🚀 Starting socket connection attempt...');
      try {
        const config = await getCurrentConfig();
        console.log('⚙️ Config loaded:', config ? `${config.serverIP}:${config.port}` : 'NO CONFIG');
        if (!config || !isMounted) {
          console.error('❌ No config or unmounted');
          return;
        }

        const socketUrl = `http://${config.serverIP}:${config.port}`;
        console.log("🌐 Socket URL:", socketUrl);
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('🔌 Socket connected:', socket.id);
          socket.emit('join_outlet', outletId);
        });

        socket.on('new_kot', (data: SocketOrderPayload) => {
          console.log('🚨 MOBILE KOT DETECTED →', data.kotNo, 'Outlet:', data.outletid, 'Table:', data.table_name);
          console.log('📦 Items:', data.items.map((i: any) => `${i.item_name || i.ItemName} x${i.qty || i.Qty}`).join(', '));
          setPendingOrders((prev) => {
            // Prevent duplicate entries for same txnId + kotNo
            if (prev.some((o) => o.txnId === data.txnId && o.kotNo === data.kotNo)) {
              console.warn('⚠️ Duplicate KOT ignored:', data.kotNo);
              return prev;
            }
            console.log('✅ New KOT queued for print:', data.kotNo);
            return [...prev, data];
          });
        });

        socket.on('disconnect', (reason: string) => {
          console.log('🔌 Socket disconnected:', reason);
        });

        socket.on('connect_error', (err: Error) => {
          console.error('Socket connection error:', err.message);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
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

  return { pendingOrders, removeOrder };
}

