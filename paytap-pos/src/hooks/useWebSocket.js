// src/hooks/useWebSocket.js
// React hook for WebSocket connection to ESP32 server

import { useEffect, useRef, useState } from 'react';

const WEBSOCKET_URL = 'ws://localhost:5173/ws';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [esp32Status, setEsp32Status] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalDisconnect = useRef(false);

  useEffect(() => {
    connectWebSocket();

    return () => {
      isIntentionalDisconnect.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      console.log('🔌 Connecting to WebSocket server...');
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected to server');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;

        // Identify as web client
        ws.send(JSON.stringify({
          type: 'web_connected',
          client_type: 'react_pos',
          timestamp: new Date().toISOString()
        }));

        // Make WebSocket globally accessible for CheckoutModal
        window.viteWebSocket = ws;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);

          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

      ws.onclose = (event) => {
        console.log('❌ WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        setEsp32Status('disconnected');
        window.viteWebSocket = null;

        // Attempt reconnection if not intentional disconnect
        if (!isIntentionalDisconnect.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnecting... (Attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionError('Failed to connect after multiple attempts. Please refresh the page.');
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'welcome':
        console.log('✅ Server welcome:', data.message);
        break;

      case 'connection_confirmed':
        console.log('✅ Connection confirmed by server');
        break;

      case 'esp32_status':
        console.log(`📡 ESP32 status: ${data.status}`);
        setEsp32Status(data.status);
        break;

      case 'rfid_scan':
        console.log('📇 RFID card scanned:', data.rfid_uid);
        
        // Dispatch custom event for CheckoutModal to listen to
        const rfidEvent = new CustomEvent('rfid-card-scanned', {
          detail: {
            uid: data.rfid_uid,
            device_id: data.device_id,
            network: data.network,
            timestamp: data.timestamp
          }
        });
        window.dispatchEvent(rfidEvent);
        break;

      case 'payment_success':
        console.log('✅ Payment success notification:', data);
        break;

      case 'payment_failed':
        console.log('❌ Payment failed notification:', data);
        break;

      case 'scan_received':
        console.log('✅ Server acknowledged scan');
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  };

  const sendMessage = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ WebSocket not connected. Cannot send message.');
      return false;
    }
  };

  const reconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;
    isIntentionalDisconnect.current = false;
    
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    setTimeout(() => {
      connectWebSocket();
    }, 500);
  };

  return {
    isConnected,
    esp32Status,
    connectionError,
    sendMessage,
    reconnect
  };
};

export default useWebSocket;