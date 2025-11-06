// server.js - Express + WebSocket Server for ESP32 RFID Scanner
// Run this with: node server.js or nodemon server.js

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5173;

// Middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Store connected clients with metadata
const clients = new Map();

console.log('=================================');
console.log('  PayTap WebSocket Server');
console.log('  Express + WebSocket');
console.log('=================================');

// REST API Routes
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'PayTap WebSocket Server',
    connections: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  const clientList = [];
  clients.forEach((data, ws) => {
    clientList.push({
      type: data.type,
      device_id: data.device_id,
      connected_at: data.connected_at,
      ip: data.ip
    });
  });
  
  res.json({
    server: 'running',
    total_connections: wss.clients.size,
    clients: clientList,
    uptime: process.uptime()
  });
});

app.post('/api/send-message', (req, res) => {
  const { message, target } = req.body;
  
  let sent = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
      sent++;
    }
  });
  
  res.json({ success: true, sent: sent });
});

// WebSocket Connection Handler
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  
  // Store client metadata
  clients.set(ws, {
    ip: clientIP,
    connected_at: new Date().toISOString(),
    type: 'unknown',
    device_id: null
  });
  
  console.log(`\n✅ New connection from: ${clientIP}`);
  console.log(`   Total connections: ${wss.clients.size}`);
  
  // Handle messages from clients
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('\n📨 Received message:');
      console.log(`   Type: ${message.type}`);
      console.log(`   Data:`, message);
      
      // Update client metadata
      const clientData = clients.get(ws);
      if (message.device_id) {
        clientData.device_id = message.device_id;
      }
      
      // Handle different message types
      switch(message.type) {
        case 'esp32_connected':
          clientData.type = 'esp32';
          console.log(`✓ ESP32 device connected: ${message.device_id}`);
          
          ws.send(JSON.stringify({
            type: 'connection_confirmed',
            message: 'ESP32 connected successfully',
            server_time: new Date().toISOString()
          }));
          
          // Notify web clients
          broadcastToWeb({
            type: 'esp32_status',
            status: 'connected',
            device_id: message.device_id
          });
          break;
          
        case 'web_connected':
          clientData.type = 'web';
          console.log(`✓ Web client connected`);
          
          ws.send(JSON.stringify({
            type: 'connection_confirmed',
            message: 'Web client connected successfully'
          }));
          break;
          
        case 'rfid_scan':
          console.log(`📇 RFID Card Scanned: ${message.rfid_uid}`);
          console.log(`   Device: ${message.device_id}`);
          console.log(`   Network: ${message.network || 'unknown'}`);
          
          // Broadcast to all web clients
          broadcastToWeb({
            type: 'rfid_scan',
            rfid_uid: message.rfid_uid,
            device_id: message.device_id,
            network: message.network,
            timestamp: new Date().toISOString()
          });
          
          // Send confirmation back to ESP32
          ws.send(JSON.stringify({
            type: 'scan_received',
            message: 'Card scan received by server',
            rfid_uid: message.rfid_uid
          }));
          break;
          
        case 'payment_request':
          console.log(`💳 Payment request: ₱${message.amount} for card ${message.rfid_uid}`);
          
          // Here you can integrate with your payment processing logic
          // For now, simulate payment processing
          setTimeout(() => {
            const success = true; // Replace with actual payment logic
            
            if (success) {
              // Send success to ESP32
              broadcastToESP32({
                type: 'payment_success',
                rfid_uid: message.rfid_uid,
                amount: message.amount,
                transaction_id: `TXN${Date.now()}`,
                timestamp: new Date().toISOString()
              });
              
              // Also notify web clients
              broadcastToWeb({
                type: 'payment_success',
                rfid_uid: message.rfid_uid,
                amount: message.amount,
                transaction_id: `TXN${Date.now()}`,
                timestamp: new Date().toISOString()
              });
              
              console.log('✅ Payment processed successfully');
            } else {
              broadcastToESP32({
                type: 'payment_failed',
                rfid_uid: message.rfid_uid,
                reason: 'Insufficient balance',
                timestamp: new Date().toISOString()
              });
              
              console.log('❌ Payment failed');
            }
          }, 1000);
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        default:
          console.log(`⚠ Unknown message type: ${message.type}`);
          // Broadcast unknown messages to all clients
          broadcastToAll(message, ws);
      }
      
    } catch (error) {
      console.error('❌ Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format',
        error: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    const clientData = clients.get(ws);
    console.log(`\n❌ Client disconnected`);
    console.log(`   Type: ${clientData?.type || 'unknown'}`);
    console.log(`   IP: ${clientIP}`);
    console.log(`   Total connections: ${wss.clients.size - 1}`);
    
    // Notify others if ESP32 disconnected
    if (clientData?.type === 'esp32') {
      broadcastToWeb({
        type: 'esp32_status',
        status: 'disconnected',
        device_id: clientData.device_id
      });
    }
    
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to PayTap WebSocket Server',
    server_time: new Date().toISOString()
  }));
});

// Helper function: Broadcast to all clients
function broadcastToAll(message, sender = null) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Broadcasted to ${count} client(s)`);
  return count;
}

// Helper function: Broadcast to ESP32 devices only
function broadcastToESP32(message) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    const clientData = clients.get(client);
    if (clientData?.type === 'esp32' && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Sent to ${count} ESP32 device(s)`);
  return count;
}

// Helper function: Broadcast to web clients only
function broadcastToWeb(message) {
  const messageStr = JSON.stringify(message);
  let count = 0;
  
  wss.clients.forEach((client) => {
    const clientData = clients.get(client);
    if (clientData?.type === 'web' && client.readyState === 1) {
      client.send(messageStr);
      count++;
    }
  });
  
  console.log(`   📤 Sent to ${count} web client(s)`);
  return count;
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`   HTTP: http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`\n   Local WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`   Network WebSocket: ws://0.0.0.0:${PORT}/ws`);
  console.log('\n👂 Waiting for connections...\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  
  wss.clients.forEach((client) => {
    client.close(1000, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Keep alive ping every 30 seconds
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.ping();
    }
  });
}, 30000);

// Log server status every minute
setInterval(() => {
  console.log(`\n📊 Server Status: ${wss.clients.size} connections`);
  clients.forEach((data, ws) => {
    console.log(`   - ${data.type}: ${data.device_id || 'unknown'} (${data.ip})`);
  });
}, 60000);