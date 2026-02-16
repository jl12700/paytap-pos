// src/hooks/useWebSocket.js
// Production-ready React hook for WebSocket connection

import { useEffect, useRef, useState } from 'react';

// Automatically detect environment
const isDevelopment = import.meta.env.MODE === 'development';

// WebSocket URL - prioritize environment variable, fallback to defaults
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || (
  isDevelopment 
    ? 'ws://localhost:10000/ws'                    // Local development (matches server.js default)
    : 'wss://paytap-backend.onrender.com/ws'       // Production
);

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
    console.log(`🌐 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
    console.log(`🔌 WebSocket URL: ${WEBSOCKET_URL}`);
    console.log(`🔌 Using env variable: ${import.meta.env.VITE_WEBSOCKET_URL ? 'Yes' : 'No (fallback)'}`);
    
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
          environment: isDevelopment ? 'development' : 'production',
          timestamp: new Date().toISOString()
        }));

        // Make WebSocket globally accessible
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
        console.log('   Environment:', data.environment);
        break;

      case 'connection_confirmed':
        console.log('✅ Connection confirmed by server');
        break;

      case 'esp32_status':
        console.log(`📡 ESP32 status: ${data.status}`);
        setEsp32Status(data.status);
        
        // Show notification
        if (data.status === 'connected') {
          console.log(`✅ ESP32 device ${data.device_id} is now online`);
        } else {
          console.log(`❌ ESP32 device ${data.device_id} went offline`);
        }
        break;

      case 'rfid_scan':
        console.log('📇 RFID card scanned:', data.rfid_uid);
        console.log('   Device:', data.device_id);
        console.log('   Network:', data.network);
        
        // Dispatch custom event for CheckoutModal
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
        
        // Dispatch event for UI updates
        const successEvent = new CustomEvent('payment-success', {
          detail: data
        });
        window.dispatchEvent(successEvent);
        break;

      case 'payment_failed':
        console.log('❌ Payment failed notification:', data);
        
        // Dispatch event for UI updates
        const failedEvent = new CustomEvent('payment-failed', {
          detail: data
        });
        window.dispatchEvent(failedEvent);
        break;

      case 'scan_received':
        console.log('✅ Server acknowledged scan');
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'error':
        console.error('❌ Server error:', data.message);
        setConnectionError(data.message);
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
      setConnectionError('WebSocket not connected');
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
    reconnect,
    websocketUrl: WEBSOCKET_URL
  };
};

export default useWebSocket;