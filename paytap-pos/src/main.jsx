// src/main.jsx
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './redux/store';

// ==================== WEBSOCKET LISTENER FOR ESP32 ====================
// This listens for RFID card scans from the ESP32 via WebSocket
if (import.meta.hot) {
  import.meta.hot.on('esp32-message', (data) => {
    console.log('📨 Message from ESP32:', data);
    
    if (data.type === 'rfid_scan') {
      console.log('📇 RFID Card Scanned:', data.rfid_uid);
      
      // Dispatch event that CheckoutModal (or any component) can listen for
      const event = new CustomEvent('rfid-card-scanned', {
        detail: {
          uid: data.rfid_uid,
          device_id: data.device_id,
          timestamp: data.timestamp
        }
      });
      window.dispatchEvent(event);
    }
  });

  import.meta.hot.on('rfid-card-scanned', (data) => {
    console.log('📇 RFID Event:', data);
    const event = new CustomEvent('rfid-card-scanned', { detail: data });
    window.dispatchEvent(event);
  });
}

// ==================== RENDER REACT APP ====================
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
