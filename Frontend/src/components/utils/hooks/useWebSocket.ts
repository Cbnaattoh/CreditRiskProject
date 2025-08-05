import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect, 
    onError,
    reconnectAttempts = 5,
    reconnectInterval = 3000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const token = useSelector((state: RootState) => state.auth.token);

  const connect = () => {
    if (!isAuthenticated || !token) {
      return;
    }

    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // Build WebSocket URL - connect to Django backend, not Vite frontend
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use Django backend port (8000) instead of Vite frontend port (5173)
      const wsHost = window.location.hostname;
      const wsPort = '8000'; // Django backend port
      
      // Add JWT token as query parameter for authentication
      const wsUrl = new URL(`${wsProtocol}//${wsHost}:${wsPort}${url}`);
      if (token) {
        wsUrl.searchParams.set('token', token);
      }

      ws.current = new WebSocket(wsUrl.toString());

      ws.current.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectCount(0);
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        ws.current = null;
        onDisconnect?.();

        // Attempt to reconnect if not a clean disconnect and we have attempts left
        if (event.code !== 1000 && reconnectCount < reconnectAttempts) {
          setReconnectCount(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        setConnectionError('Connection failed');
        onError?.(error);
      };

    } catch (error) {
      setConnectionError('Failed to create connection');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (ws.current) {
      ws.current.close(1000, 'User disconnected');
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    } else {
      return false;
    }
  };

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    connectionError,
    reconnectCount,
    sendMessage,
    connect,
    disconnect
  };
};