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
  const [pendingOrders, setPendingOrders] = useState<SocketOrderPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const removeOrder = useCallback((txnId: number) => {
    setPendingOrders((prev) => prev.filter((o) => o.txnId !== txnId));
  }, []);

  useEffect(() => {
    if (!outletId) return;

    let isMounted = true;

    const connectSocket = async () => {
      try {
        const config = await getCurrentConfig();
        if (!config || !isMounted) return;

        const socketUrl = `http://${config.serverIP}:${config.port}`;
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
          console.log('📡 new_kot received:', data);
          setPendingOrders((prev) => {
            // Prevent duplicate entries for same txnId + kotNo
            if (prev.some((o) => o.txnId === data.txnId && o.kotNo === data.kotNo)) {
              return prev;
            }
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

