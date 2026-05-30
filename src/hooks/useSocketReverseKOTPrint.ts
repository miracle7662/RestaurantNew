import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentConfig } from '@/config';

export interface SocketReverseKOTPayload {
  txnId: number;
  outletid: number;
  tableId: number | null;
  revKotNo: number;
  items: any[];
  reason?: string;
  reversalDate?: string | null;
}

export function useSocketReverseKOTPrint(outletId: number | null | undefined) {
  const [pendingReverseKOTs, setPendingReverseKOTs] = useState<SocketReverseKOTPayload[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const removeReverseKOT = useCallback((txnId: number, revKotNo?: number) => {
    setPendingReverseKOTs((prev) =>
      prev.filter((o) => {
        if (revKotNo === undefined) return o.txnId !== txnId;
        return !(o.txnId === txnId && o.revKotNo === revKotNo);
      }),
    );
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

        console.log('[useSocketReverseKOTPrint] connecting socket:', {
          outletId,
          socketUrl,
        });

        socket.on('connect', () => {
          console.log('[useSocketReverseKOTPrint] socket connected, joining outlet:', outletId);
          socket.emit('join_outlet', outletId);
        });

        socket.on('reverse_kot', (data: SocketReverseKOTPayload) => {
          console.log('[useSocketReverseKOTPrint] reverse_kot event received:', {
            txnId: data?.txnId,
            outletid: data?.outletid,
            tableId: data?.tableId,
            revKotNo: data?.revKotNo,
            itemsLen: data?.items?.length ?? 0,
            reason: data?.reason,
          });

          setPendingReverseKOTs((prev) => {
            const exists = prev.some(
              (o) => o.txnId === data.txnId && (o.revKotNo === data.revKotNo || o.revKotNo === undefined),
            );
            if (exists) return prev;
            return [...prev, data];
          });
        });

        socket.on('connect_error', () => {
          // no-op
        });
      } catch {
        // no-op
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

  return { pendingReverseKOTs, removeReverseKOT };
}

