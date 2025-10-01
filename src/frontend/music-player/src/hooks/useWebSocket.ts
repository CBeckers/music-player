import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  onPlaybackUpdate?: (data: string) => void;
  onQueueUpdate?: (data: string) => void;
  onAuthUpdate?: (isAuthenticated: boolean) => void;
  onControlAction?: (action: string, result: string) => void;
  onStatusMessage?: (message: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const socket = new SockJS('https://cadebeckers.com/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000, // Auto-reconnect after 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      console.log('WebSocket Connected:', frame);
      setIsConnected(true);
      setConnectionError(null);

      // Subscribe to music updates
      stompClient.subscribe('/topic/music-updates', (message) => {
        try {
          const wsMessage: WebSocketMessage = JSON.parse(message.body);
          console.log('Received WebSocket message:', wsMessage);

          switch (wsMessage.type) {
            case 'playback_update':
              options.onPlaybackUpdate?.(wsMessage.data);
              break;
            case 'queue_update':
              options.onQueueUpdate?.(wsMessage.data);
              break;
            case 'auth_update':
              options.onAuthUpdate?.(wsMessage.data);
              break;
            case 'control_action':
              options.onControlAction?.(wsMessage.data.action, wsMessage.data.result);
              break;
            case 'status_message':
              options.onStatusMessage?.(wsMessage.data);
              break;
            default:
              console.log('Unknown message type:', wsMessage.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      setConnectionError('Connection error: ' + frame.headers['message']);
      setIsConnected(false);
    };

    stompClient.onWebSocketClose = (event) => {
      console.log('WebSocket connection closed:', event);
      setIsConnected(false);
    };

    stompClient.onDisconnect = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    // Connect
    stompClient.activate();
    clientRef.current = stompClient;

    // Cleanup function
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [options.onPlaybackUpdate, options.onQueueUpdate, options.onAuthUpdate, options.onControlAction, options.onStatusMessage]);

  return {
    isConnected,
    connectionError,
    client: clientRef.current
  };
}