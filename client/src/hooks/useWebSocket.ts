import { useEffect, useRef } from 'react';

interface WebSocketEvent {
  event: string;
  board_id: string;
  sender_id?: string;
  payload: any;
}

export function useWebSocket(
  boardId: string | null,
  onEvent: (event: WebSocketEvent) => void
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!boardId) return;

    let wsUrl = '';
    if (import.meta.env.VITE_WS_URL) {
      wsUrl = `${import.meta.env.VITE_WS_URL}?board_id=${boardId}`;
    } else if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/api/v1/ws?board_id=${boardId}`;
    }

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log(`[WS] Connected to board real-time stream: ${boardId}`);
    };

    socket.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data);
        console.log('[WS] Received event:', data.event, data);
        onEvent(data);
      } catch (err) {
        console.error('[WS] Failed to parse message:', err);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected from board stream');
    };

    return () => {
      socket.close();
    };
  }, [boardId]);

  return wsRef;
}
